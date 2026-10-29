import "server-only";

import { getPlayerFirstName } from "@/lib/account-shared";
import { sendNotificationEmail } from "@/lib/email-delivery-server";
import { EMAIL_REPLY_TO } from "@/lib/email-layout";
import { getPublicAppUrl } from "@/lib/public-app-url";
import {
  buildCoachNewPaidMembershipEmailText,
  buildMembershipLevelWelcomeEmail,
  buildTwelveWeekProgramWelcomeEmail,
  membershipWelcomeDedupeKey,
  membershipWelcomeMarketingType,
  twelveWeekProgramWelcomeDedupeKey,
  twelveWeekProgramWelcomeMarketingType,
} from "@/lib/membership-welcome-email-shared";
import { MEMBERSHIP_LEVELS, type MembershipLevelKey } from "@/lib/membership-levels-shared";
import { isPaidMembershipLevelKey } from "@/lib/membership-welcome-email-shared";
import { sendCoachNotificationEmail } from "@/lib/notifications";
import { resolveParentCopyEmail } from "@/lib/parent-copy-email-server";
import { prisma } from "@/lib/prisma";

export { isPaidMembershipLevelKey as isPaidMembershipLevel } from "@/lib/membership-welcome-email-shared";

/** Transactional: ignores marketingEmailsSuppressed; no marketing unsubscribe footer. */
export async function sendMembershipLevelWelcomeIfNeeded(params: {
  userId: string;
  level: MembershipLevelKey;
}) {
  if (!isPaidMembershipLevelKey(params.level)) {
    return { sent: false as const, reason: "not_paid_level" as const };
  }

  const dedupeKey = membershipWelcomeDedupeKey(params.userId, params.level);
  const alreadySent = await prisma.marketingEmailLog.findUnique({
    where: { dedupeKey },
    select: { id: true },
  });
  if (alreadySent) {
    return { sent: false as const, reason: "already_sent" as const };
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      email: true,
      name: true,
      playerFirstName: true,
      accountRole: true,
      accountHolderName: true,
      isTestAccount: true,
      programEnrollment: {
        select: { onboardingCompletedAt: true },
      },
    },
  });

  if (!user?.email) {
    return { sent: false as const, reason: "no_user" as const };
  }

  const firstName = getPlayerFirstName({
    playerFirstName: user.playerFirstName,
    name: user.name,
    email: user.email,
  });

  const content = buildMembershipLevelWelcomeEmail(params.level, {
    firstName,
    showAllAccessSetupLink:
      params.level === "ALL_ACCESS" && !user.programEnrollment?.onboardingCompletedAt,
  });

  const fromEmail = process.env.NOTIFICATION_EMAIL;
  if (!fromEmail) {
    throw new Error("NOTIFICATION_EMAIL is required for membership welcome emails.");
  }

  await sendNotificationEmail({
    from: `"Coach Broc | LCB Training" <${fromEmail}>`,
    to: user.email,
    replyTo: EMAIL_REPLY_TO,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });

  const parentEmail = await resolveParentCopyEmail(params.userId);
  if (parentEmail) {
    await sendNotificationEmail({
      from: `"Coach Broc | LCB Training" <${fromEmail}>`,
      to: parentEmail,
      replyTo: EMAIL_REPLY_TO,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });
  }

  await prisma.marketingEmailLog.create({
    data: {
      userId: params.userId,
      type: membershipWelcomeMarketingType(),
      dedupeKey,
      anchorSubmissionId: null,
    },
  });

  await sendCoachNewPaidMembershipNotification({
    userId: params.userId,
    level: params.level,
    skipIfTestAccount: user.isTestAccount,
  });

  return { sent: true as const };
}

/** Transactional 12-Week purchase welcome; parent copy when a distinct parent email is on file. */
export async function sendTwelveWeekProgramWelcomeIfNeeded(params: { userId: string }) {
  const dedupeKey = twelveWeekProgramWelcomeDedupeKey(params.userId);
  const alreadySent = await prisma.marketingEmailLog.findUnique({
    where: { dedupeKey },
    select: { id: true },
  });
  if (alreadySent) {
    return { sent: false as const, reason: "already_sent" as const };
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      email: true,
      name: true,
      playerFirstName: true,
      programEnrollment: {
        select: { onboardingCompletedAt: true },
      },
    },
  });

  if (!user?.email) {
    return { sent: false as const, reason: "no_user" as const };
  }

  const firstName = getPlayerFirstName({
    playerFirstName: user.playerFirstName,
    name: user.name,
    email: user.email,
  });

  const content = buildTwelveWeekProgramWelcomeEmail({
    firstName,
    showSetupLink: !user.programEnrollment?.onboardingCompletedAt,
  });

  const fromEmail = process.env.NOTIFICATION_EMAIL;
  if (!fromEmail) {
    throw new Error("NOTIFICATION_EMAIL is required for 12-Week program welcome emails.");
  }

  await sendNotificationEmail({
    from: `"Coach Broc | LCB Training" <${fromEmail}>`,
    to: user.email,
    replyTo: EMAIL_REPLY_TO,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });

  const parentEmail = await resolveParentCopyEmail(params.userId);
  if (parentEmail) {
    await sendNotificationEmail({
      from: `"Coach Broc | LCB Training" <${fromEmail}>`,
      to: parentEmail,
      replyTo: EMAIL_REPLY_TO,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });
  }

  await prisma.marketingEmailLog.create({
    data: {
      userId: params.userId,
      type: twelveWeekProgramWelcomeMarketingType(),
      dedupeKey,
      anchorSubmissionId: null,
    },
  });

  return { sent: true as const };
}

export async function sendCoachNewPaidMembershipNotification(params: {
  userId: string;
  level: MembershipLevelKey;
  skipIfTestAccount?: boolean;
}) {
  if (params.skipIfTestAccount) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      name: true,
      email: true,
      organization: { select: { name: true } },
    },
  });

  if (!user) {
    return;
  }

  const memberAdminUrl = `${getPublicAppUrl()}/admin/members/${params.userId}`;
  const levelLabel = MEMBERSHIP_LEVELS[params.level].displayName;
  const price = MEMBERSHIP_LEVELS[params.level].priceDisplay;
  const displayName = user.name?.trim() || user.email;

  await sendCoachNotificationEmail({
    subject: `New ${levelLabel} member: ${displayName} (${price})`,
    text: buildCoachNewPaidMembershipEmailText({
      level: params.level,
      name: user.name ?? "",
      email: user.email,
      orgName: user.organization?.name ?? null,
      memberAdminUrl,
    }),
  });
}

