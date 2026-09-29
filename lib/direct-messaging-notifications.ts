import "server-only";

import {
  COACH_NEW_MESSAGE_PUSH_TITLE_PREFIX,
  COACH_REPLY_PUSH_TITLE,
  truncateMessagePreview,
} from "@/lib/direct-messaging-shared";
import { isPlayerPushQuietHours } from "@/lib/direct-messaging-quiet-hours";
import { getChicagoTodayDateKey } from "@/lib/program-schedule";
import { sendCoachAlertPushSafe } from "@/lib/coach-push-send";
import { getPlayerFirstName } from "@/lib/program-email-templates";
import { buildEmailButton, buildMemberEmailHtml, escapeHtml, getPublicAppUrl } from "@/lib/email-layout";
import { hasProgramEmailBeenSent, sendProgramEmail } from "@/lib/program-email-send";
import { buildPushDedupeKey, sendPushToUserSafe, userHasPushSubscriptions } from "@/lib/push-send";
import { prisma } from "@/lib/prisma";

function buildCoachConversationUrl(conversationId: string) {
  return `/admin/messages/${conversationId}`;
}

export async function notifyCoachOfPlayerMessage(params: {
  conversationId: string;
  playerUserId: string;
  playerName: string | null;
  playerEmail: string;
  body: string;
}) {
  try {
    const firstName = getPlayerFirstName(params.playerName, params.playerEmail);
    const preview = truncateMessagePreview(params.body);
    const dateKey = getChicagoTodayDateKey();
    const dedupeKey = `coach:COACH_NEW_MESSAGE:${params.conversationId}:${dateKey}:${Date.now()}`;

    await sendCoachAlertPushSafe({
      type: "COACH_NEW_MESSAGE",
      dedupeKey,
      settingKey: "newMessagesEnabled",
      message: {
        title: `${COACH_NEW_MESSAGE_PUSH_TITLE_PREFIX} ${firstName}`,
        body: preview,
        url: buildCoachConversationUrl(params.conversationId),
      },
    });
  } catch (error) {
    console.error("Coach message push failed", error);
  }
}

async function sendPlayerCoachReplyPush(params: {
  userId: string;
  body: string;
  dateKey: string;
}) {
  const preview = truncateMessagePreview(params.body);
  const dedupeKey = buildPushDedupeKey(params.userId, "COACH_REPLY", params.dateKey);

  await sendPushToUserSafe(
    params.userId,
    {
      title: COACH_REPLY_PUSH_TITLE,
      body: preview,
      url: "/messages",
    },
    { type: "COACH_REPLY", dedupeKey },
  );
}

async function sendPlayerCoachReplyEmail(params: {
  userId: string;
  toEmail: string;
  body: string;
  dateKey: string;
  hourKey: string;
}) {
  const dedupeKey = `coach-reply-email:${params.userId}:${params.hourKey}`;
  if (
    await hasProgramEmailBeenSent({
      enrollmentId: null,
      recipient: "player",
      type: "COACH_MESSAGE_REPLY",
      dateKey: dedupeKey,
    })
  ) {
    return;
  }

  const messagesUrl = `${getPublicAppUrl()}/messages`;
  const preview = escapeHtml(truncateMessagePreview(params.body, 200));
  const subject = COACH_REPLY_PUSH_TITLE;
  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">${escapeHtml(subject)}</h1>
      <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${preview}</p>
      ${buildEmailButton("View messages", messagesUrl)}`;
  const text = `${subject}\n\n${truncateMessagePreview(params.body, 200)}\n\nView messages: ${messagesUrl}`;

  await sendProgramEmail({
    to: params.toEmail,
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml }),
    text,
    enrollmentId: null,
    recipient: "player",
    type: "COACH_MESSAGE_REPLY",
    dateKey: dedupeKey,
  });
}

export async function notifyPlayerOfCoachReply(params: {
  conversationId: string;
  userId: string;
  userEmail: string;
  body: string;
  messageId: string;
  now?: Date;
}) {
  try {
    const now = params.now ?? new Date();
    const dateKey = getChicagoTodayDateKey(now);
    const hourKey = `${dateKey}-${now.getUTCHours()}`;

    if (isPlayerPushQuietHours(now)) {
      await prisma.conversation.update({
        where: { id: params.conversationId },
        data: {
          playerReplyNotifyPending: true,
          playerReplyNotifyMessageId: params.messageId,
        },
      });

      return;
    }

    const hasPush = await userHasPushSubscriptions(params.userId);
    if (hasPush) {
      await sendPlayerCoachReplyPush({
        userId: params.userId,
        body: params.body,
        dateKey,
      });
      return;
    }

    await sendPlayerCoachReplyEmail({
      userId: params.userId,
      toEmail: params.userEmail,
      body: params.body,
      dateKey,
      hourKey,
    });
  } catch (error) {
    console.error("Player coach reply notification failed", error);
  }
}

export async function processQueuedPlayerCoachReplyNotifications(now = new Date()) {
  const pending = await prisma.conversation.findMany({
    where: { playerReplyNotifyPending: true },
    include: {
      enrollment: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
    },
  });

  const dateKey = getChicagoTodayDateKey(now);

  for (const conversation of pending) {
    try {
      const message = conversation.playerReplyNotifyMessageId
        ? await prisma.message.findUnique({
            where: { id: conversation.playerReplyNotifyMessageId },
            select: { body: true },
          })
        : await prisma.message.findFirst({
            where: { conversationId: conversation.id, fromCoach: true },
            orderBy: { createdAt: "desc" },
            select: { body: true },
          });

      if (!message) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            playerReplyNotifyPending: false,
            playerReplyNotifyMessageId: null,
          },
        });
        continue;
      }

      const userId = conversation.enrollment.user.id;
      const hasPush = await userHasPushSubscriptions(userId);

      if (hasPush) {
        await sendPlayerCoachReplyPush({
          userId,
          body: message.body,
          dateKey,
        });
      } else {
        const hourKey = `${dateKey}-morning`;
        await sendPlayerCoachReplyEmail({
          userId,
          toEmail: conversation.enrollment.user.email,
          body: message.body,
          dateKey,
          hourKey,
        });
      }

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          playerReplyNotifyPending: false,
          playerReplyNotifyMessageId: null,
        },
      });
    } catch (error) {
      console.error("Queued player coach reply notification failed", error);
    }
  }
}

export async function sendTestCoachNewMessagePush(params: {
  playerFirstName: string;
  body: string;
  conversationId?: string;
}) {
  const result = await sendCoachAlertPushSafe({
    type: "COACH_NEW_MESSAGE",
    dedupeKey: `coach:COACH_NEW_MESSAGE:TEST:${Date.now()}`,
    settingKey: "newMessagesEnabled",
    skipDedupeCheck: true,
    message: {
      title: `${COACH_NEW_MESSAGE_PUSH_TITLE_PREFIX} ${params.playerFirstName}`,
      body: truncateMessagePreview(params.body),
      url: buildCoachConversationUrl(params.conversationId ?? "test"),
    },
  });

  if (result.sent === 0) {
    throw new Error(
      result.reason === "no_subscriptions"
        ? "Turn on coach alerts on this phone first."
        : "Unable to send test coach message push.",
    );
  }
}

export async function sendTestCoachReplyPush(params: { body: string; userId: string }) {
  const result = await sendPushToUserSafe(
    params.userId,
    {
      title: COACH_REPLY_PUSH_TITLE,
      body: truncateMessagePreview(params.body),
      url: "/messages",
    },
    {
      type: "COACH_REPLY",
      dedupeKey: `coach-reply:test:${Date.now()}`,
      skipDedupeCheck: true,
    },
  );

  if (result.sent === 0) {
    throw new Error("Unable to send test coach reply push.");
  }
}

export async function sendTestCoachReplyEmail(params: { toEmail: string; body: string }) {
  const messagesUrl = `${getPublicAppUrl()}/messages`;
  const preview = escapeHtml(truncateMessagePreview(params.body, 200));
  const subject = `[TEST] ${COACH_REPLY_PUSH_TITLE}`;
  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">${escapeHtml(COACH_REPLY_PUSH_TITLE)}</h1>
      <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${preview}</p>
      ${buildEmailButton("View messages", messagesUrl)}`;
  const text = `${COACH_REPLY_PUSH_TITLE}\n\n${truncateMessagePreview(params.body, 200)}\n\nView messages: ${messagesUrl}`;

  await sendProgramEmail({
    to: params.toEmail,
    subject,
    html: buildMemberEmailHtml({ title: COACH_REPLY_PUSH_TITLE, bodyContentHtml }),
    text,
    enrollmentId: null,
    recipient: "player",
    type: "COACH_MESSAGE_REPLY",
    dateKey: `test-${getChicagoTodayDateKey()}`,
    skipLog: true,
  });

  return subject;
}
