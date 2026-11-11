import { sendNotificationEmail } from "@/lib/email-delivery-server";
import {
  ORG_TEAM_PICK_NUDGE_EMAIL_SUBJECT,
  ORG_TEAM_PICK_NUDGE_EMAIL_TEXT,
  ORG_TEAM_PICK_NUDGE_PUSH_BODY,
  ORG_TEAM_PICK_NUDGE_PUSH_TITLE,
  ORG_TEAM_PICK_NUDGE_URL,
  type OrgTeamPickNudgeChannel,
  type OrgTeamPickNudgeSkipReason,
} from "@/lib/org-team-pick-nudge-shared";
import { prisma } from "@/lib/prisma";
import {
  buildPushDedupeKey,
  sendPushToUser,
  userHasPushSubscriptions,
} from "@/lib/push-send";

export type OrgTeamPickNudgeRecipient = {
  userId: string;
  email: string;
  name: string;
  hasPush: boolean;
  channel: OrgTeamPickNudgeChannel;
};

export type OrgTeamPickNudgeSkipped = {
  userId: string;
  email: string;
  name: string;
  reason: OrgTeamPickNudgeSkipReason;
  nudgedAt: string | null;
};

export type OrgTeamPickNudgeSentLog = {
  userId: string;
  email: string;
  name: string;
  sentAt: string;
};

export type OrgTeamPickNudgePreview = {
  organizationId: string;
  organizationName: string;
  hasActiveTeams: boolean;
  recipients: OrgTeamPickNudgeRecipient[];
  skipped: OrgTeamPickNudgeSkipped[];
  previouslySent: OrgTeamPickNudgeSentLog[];
};

export type OrgTeamPickNudgeSendResult = {
  sent: Array<{
    userId: string;
    email: string;
    name: string;
    channel: OrgTeamPickNudgeChannel;
    sentAt: string;
  }>;
  errors: Array<{ userId: string; email: string; error: string }>;
};

function displayName(user: {
  email: string;
  name: string | null;
  playerFirstName: string | null;
  playerLastName: string | null;
}) {
  return (
    [user.playerFirstName, user.playerLastName].filter(Boolean).join(" ").trim() ||
    user.name?.trim() ||
    user.email
  );
}

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export async function previewOrgTeamPickNudge(
  organizationId: string,
): Promise<OrgTeamPickNudgePreview | null> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      _count: { select: { teams: { where: { active: true } } } },
    },
  });
  if (!org) {
    return null;
  }

  const hasActiveTeams = org._count.teams > 0;
  const users = await prisma.user.findMany({
    where: {
      organizationId,
      orgTeamId: null,
    },
    orderBy: [{ signupDate: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      playerFirstName: true,
      playerLastName: true,
      isTestAccount: true,
      orgTeamNotListedAt: true,
      orgTeamPickNudgeSentAt: true,
    },
  });

  const recipients: OrgTeamPickNudgeRecipient[] = [];
  const skipped: OrgTeamPickNudgeSkipped[] = [];
  const previouslySent: OrgTeamPickNudgeSentLog[] = [];

  if (!hasActiveTeams) {
    return {
      organizationId: org.id,
      organizationName: org.name,
      hasActiveTeams: false,
      recipients: [],
      skipped: [],
      previouslySent: [],
    };
  }

  for (const user of users) {
    const name = displayName(user);
    const nudgedAt = toIso(user.orgTeamPickNudgeSentAt);

    if (user.orgTeamPickNudgeSentAt) {
      previouslySent.push({
        userId: user.id,
        email: user.email,
        name,
        sentAt: user.orgTeamPickNudgeSentAt.toISOString(),
      });
      skipped.push({
        userId: user.id,
        email: user.email,
        name,
        reason: "already_nudged",
        nudgedAt,
      });
      continue;
    }

    if (user.orgTeamNotListedAt) {
      skipped.push({
        userId: user.id,
        email: user.email,
        name,
        reason: "not_listed",
        nudgedAt: null,
      });
      continue;
    }

    if (user.isTestAccount) {
      skipped.push({
        userId: user.id,
        email: user.email,
        name,
        reason: "test_account",
        nudgedAt: null,
      });
      continue;
    }

    const email = user.email.trim();
    if (!email) {
      skipped.push({
        userId: user.id,
        email: user.email,
        name,
        reason: "no_contact",
        nudgedAt: null,
      });
      continue;
    }

    const hasPush = await userHasPushSubscriptions(user.id);
    recipients.push({
      userId: user.id,
      email,
      name,
      hasPush,
      channel: hasPush ? "push" : "email",
    });
  }

  previouslySent.sort((a, b) => a.sentAt.localeCompare(b.sentAt));

  return {
    organizationId: org.id,
    organizationName: org.name,
    hasActiveTeams: true,
    recipients,
    skipped,
    previouslySent,
  };
}

export async function sendOrgTeamPickNudge(
  organizationId: string,
): Promise<OrgTeamPickNudgeSendResult> {
  const preview = await previewOrgTeamPickNudge(organizationId);
  if (!preview) {
    throw new Error("Organization not found.");
  }

  const sent: OrgTeamPickNudgeSendResult["sent"] = [];
  const errors: OrgTeamPickNudgeSendResult["errors"] = [];

  for (const candidate of preview.recipients) {
    try {
      let channel: OrgTeamPickNudgeChannel = candidate.channel;

      if (candidate.channel === "push") {
        const dedupeKey = buildPushDedupeKey(candidate.userId, "ORG_TEAM_PICK", "once");
        const result = await sendPushToUser(
          candidate.userId,
          {
            title: ORG_TEAM_PICK_NUDGE_PUSH_TITLE,
            body: ORG_TEAM_PICK_NUDGE_PUSH_BODY,
            url: ORG_TEAM_PICK_NUDGE_URL,
          },
          { type: "ORG_TEAM_PICK", dedupeKey },
        );
        if (result.sent <= 0) {
          await sendNotificationEmail({
            to: candidate.email,
            subject: ORG_TEAM_PICK_NUDGE_EMAIL_SUBJECT,
            text: ORG_TEAM_PICK_NUDGE_EMAIL_TEXT,
          });
          channel = "email";
        }
      } else {
        await sendNotificationEmail({
          to: candidate.email,
          subject: ORG_TEAM_PICK_NUDGE_EMAIL_SUBJECT,
          text: ORG_TEAM_PICK_NUDGE_EMAIL_TEXT,
        });
      }

      const sentAtDate = new Date();
      const updated = await prisma.user.updateMany({
        where: {
          id: candidate.userId,
          organizationId,
          orgTeamId: null,
          orgTeamNotListedAt: null,
          orgTeamPickNudgeSentAt: null,
          isTestAccount: false,
        },
        data: { orgTeamPickNudgeSentAt: sentAtDate },
      });

      if (updated.count === 0) {
        errors.push({
          userId: candidate.userId,
          email: candidate.email,
          error: "Skipped after send (already nudged or no longer eligible).",
        });
        continue;
      }

      sent.push({
        userId: candidate.userId,
        email: candidate.email,
        name: candidate.name,
        channel,
        sentAt: sentAtDate.toISOString(),
      });
    } catch (error) {
      errors.push({
        userId: candidate.userId,
        email: candidate.email,
        error: error instanceof Error ? error.message : "send failed",
      });
    }
  }

  return { sent, errors };
}
