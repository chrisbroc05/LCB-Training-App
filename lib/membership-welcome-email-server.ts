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
import {
  getMembershipBilledPriceDisplay,
  parseMembershipBillingInterval,
  type MembershipBillingIntervalKey,
} from "@/lib/membership-billing-shared";
import { MEMBERSHIP_LEVELS, type MembershipLevelKey } from "@/lib/membership-levels-shared";
import { isPaidMembershipLevelKey } from "@/lib/membership-welcome-email-shared";
import { FOUNDING_PLUS_MONTHLY_COACH_PRICE_LINE } from "@/lib/founding-offer-shared";
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
      membershipSubscription: {
        select: {
          billingInterval: true,
          foundingDiscountEndsAt: true,
          level: true,
        },
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

  const welcomeBilling = resolveMembershipWelcomeBillingContext(
    params.level,
    user.membershipSubscription,
  );

  const content = buildMembershipLevelWelcomeEmail(params.level, {
    firstName,
    showAllAccessSetupLink:
      params.level === "ALL_ACCESS" && !user.programEnrollment?.onboardingCompletedAt,
    billingInterval: welcomeBilling.billingInterval,
    foundingPlusMonthlyActive: welcomeBilling.foundingPlusMonthlyActive,
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
    billingInterval: welcomeBilling.billingInterval,
    foundingPlusMonthlyActive: welcomeBilling.foundingPlusMonthlyActive,
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

function resolveMembershipWelcomeBillingContext(
  level: MembershipLevelKey,
  subscription: {
    billingInterval: string | null;
    foundingDiscountEndsAt: Date | null;
    level: string;
  } | null,
): { billingInterval: MembershipBillingIntervalKey; foundingPlusMonthlyActive: boolean } {
  const billingInterval = parseMembershipBillingInterval(subscription?.billingInterval ?? "MONTHLY");
  const now = Date.now();
  const foundingEnds = subscription?.foundingDiscountEndsAt?.getTime() ?? 0;
  const foundingPlusMonthlyActive =
    level === "PLUS" &&
    billingInterval === "MONTHLY" &&
    foundingEnds > now &&
    subscription?.level === "PLUS";
  return { billingInterval, foundingPlusMonthlyActive };
}

export async function sendCoachNewPaidMembershipNotification(params: {
  userId: string;
  level: MembershipLevelKey;
  skipIfTestAccount?: boolean;
  billingInterval?: MembershipBillingIntervalKey;
  foundingPlusMonthlyActive?: boolean;
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
  const displayName = user.name?.trim() || user.email;

  let billingInterval = params.billingInterval;
  let foundingPlusMonthlyActive = params.foundingPlusMonthlyActive;
  if (billingInterval === undefined || foundingPlusMonthlyActive === undefined) {
    const sub = await prisma.membershipSubscription.findUnique({
      where: { userId: params.userId },
      select: { billingInterval: true, foundingDiscountEndsAt: true, level: true },
    });
    const resolved = resolveMembershipWelcomeBillingContext(params.level, sub);
    billingInterval = billingInterval ?? resolved.billingInterval;
    foundingPlusMonthlyActive =
      foundingPlusMonthlyActive ?? resolved.foundingPlusMonthlyActive;
  }

  const coachPriceLine =
    foundingPlusMonthlyActive && params.level === "PLUS" && billingInterval === "MONTHLY"
      ? FOUNDING_PLUS_MONTHLY_COACH_PRICE_LINE
      : getMembershipBilledPriceDisplay({
          level: params.level,
          billingInterval,
          foundingPlusMonthlyActive,
        });

  await sendCoachNotificationEmail({
    subject: `New ${levelLabel} member: ${displayName} (${coachPriceLine})`,
    text: buildCoachNewPaidMembershipEmailText({
      level: params.level,
      name: user.name ?? "",
      email: user.email,
      orgName: user.organization?.name ?? null,
      memberAdminUrl,
      billingInterval,
      foundingPlusMonthlyActive,
    }),
  });
}

