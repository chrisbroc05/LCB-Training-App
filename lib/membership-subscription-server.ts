import "server-only";

import type { MembershipLevel, SubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import {
  MEMBERSHIP_SUBSCRIPTION_GRACE_DAYS,
  mapStripeSubscriptionStatus,
  parseMembershipLevelFromMetadata,
  subscriptionStatusGrantsAccess,
} from "@/lib/membership-subscription-shared";
import {
  mapStripePriceIdToMembershipLevel,
} from "@/lib/stripe-membership-prices-server";
import {
  activateAllAccessMembership,
  ensureProgramEnrollmentForUser,
} from "@/lib/program-enrollment";
import { sendCoachNewProgramPlayerPushForUser } from "@/lib/coach-push-instant";
import { getInvoiceLinePriceId } from "@/lib/stripe-invoice-shared";

export function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const itemPeriodEnds = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === "number");

  if (!itemPeriodEnds.length) {
    return null;
  }

  return new Date(Math.max(...itemPeriodEnds) * 1000);
}

export async function getPlatformCoachingSettings() {
  return prisma.platformCoachingSettings.upsert({
    where: { id: "default" },
    create: { id: "default", allAccessProgramCap: 25 },
    update: {},
  });
}

export async function countAllAccessProgramCapUsage(now = new Date()): Promise<number> {
  const [allAccessSubs, twelveWeekPlayers] = await Promise.all([
    prisma.membershipSubscription.count({
      where: {
        level: "ALL_ACCESS",
        status: { in: ["ACTIVE", "CANCEL_AT_PERIOD_END", "PAST_DUE"] },
      },
    }),
    prisma.user.count({
      where: {
        membershipTier: "TWELVE_WEEK",
        programEnrollment: {
          is: {
            status: "ACTIVE",
            planMode: "FIXED_12_WEEK",
          },
        },
        OR: [{ twelveWeekProgramEndsAt: null }, { twelveWeekProgramEndsAt: { gte: now } }],
      },
    }),
  ]);
  return allAccessSubs + twelveWeekPlayers;
}

export async function isAllAccessCheckoutAvailable(): Promise<boolean> {
  const settings = await getPlatformCoachingSettings();
  const used = await countAllAccessProgramCapUsage();
  return used < settings.allAccessProgramCap;
}

export async function resolveOrgAttributionForCheckout(params: {
  userId: string;
  orgJoinCode?: string | null;
}): Promise<{ organizationId: string | null; orgJoinedAt: Date | null }> {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { organizationId: true, orgJoinedAt: true },
  });
  if (user?.organizationId) {
    return {
      organizationId: user.organizationId,
      orgJoinedAt: user.orgJoinedAt,
    };
  }

  const code = params.orgJoinCode?.trim();
  if (!code) {
    return { organizationId: null, orgJoinedAt: null };
  }

  const { joinOrganizationForUser } = await import("@/lib/org-server");
  const result = await joinOrganizationForUser({
    userId: params.userId,
    codeRaw: code,
    orgTeamId: null,
  });
  if (!result.ok) {
    throw new Error(result.error);
  }

  const joined = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { organizationId: true, orgJoinedAt: true },
  });
  return {
    organizationId: joined?.organizationId ?? result.organization.id,
    orgJoinedAt: joined?.orgJoinedAt ?? new Date(),
  };
}

export async function claimStripeWebhookEvent(eventId: string, type: string): Promise<boolean> {
  try {
    await prisma.stripeWebhookEvent.create({
      data: { stripeEventId: eventId, type },
    });
    return true;
  } catch {
    return false;
  }
}

function graceEndFromNow(now: Date): Date {
  return new Date(now.getTime() + MEMBERSHIP_SUBSCRIPTION_GRACE_DAYS * 24 * 60 * 60 * 1000);
}

export async function syncUserDenormalizedFromSubscription(
  userId: string,
  sub: {
    level: MembershipLevel;
    status: SubscriptionStatus;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    stripePriceId: string | null;
    pastDueGraceEndsAt: Date | null;
  },
) {
  const now = new Date();
  const grantsAccess = subscriptionStatusGrantsAccess(sub.status, {
    now,
    currentPeriodEnd: sub.currentPeriodEnd,
    pastDueGraceEndsAt: sub.pastDueGraceEndsAt,
  });

  const userUpdate: {
    membershipLevel: MembershipLevel | null;
    membershipLevelExpiresAt: Date | null;
    subscriptionStatus: SubscriptionStatus;
    subscriptionCurrentPeriodEnd: Date | null;
    subscriptionCancelAtPeriodEnd: boolean;
    stripeCustomerId: string;
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
    pendingCheckoutLevel: null;
  } = {
    membershipLevel: grantsAccess ? sub.level : null,
    membershipLevelExpiresAt:
      grantsAccess && sub.cancelAtPeriodEnd ? sub.currentPeriodEnd : grantsAccess ? null : null,
    subscriptionStatus: sub.status,
    subscriptionCurrentPeriodEnd: sub.currentPeriodEnd,
    subscriptionCancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    stripeCustomerId: sub.stripeCustomerId,
    stripeSubscriptionId: grantsAccess ? sub.stripeSubscriptionId : null,
    stripePriceId: grantsAccess ? sub.stripePriceId : null,
    pendingCheckoutLevel: null,
  };

  await prisma.user.update({
    where: { id: userId },
    data: userUpdate,
  });
}

async function endAllAccessProgramIfNeeded(userId: string, level: MembershipLevelKey) {
  if (level !== "ALL_ACCESS") {
    return;
  }
  const enrollment = await prisma.programEnrollment.findUnique({
    where: { userId },
    select: { id: true, planMode: true, status: true },
  });
  if (!enrollment || enrollment.planMode !== "OPEN_ENDED") {
    return;
  }
  await prisma.programEnrollment.update({
    where: { id: enrollment.id },
    data: { status: "COMPLETED" },
  });
}

async function activateAllAccessIfNeeded(userId: string, level: MembershipLevelKey, previousLevel: MembershipLevelKey | null) {
  if (level !== "ALL_ACCESS") {
    return;
  }
  if (previousLevel === "ALL_ACCESS") {
    return;
  }
  await activateAllAccessMembership(userId);
  void sendCoachNewProgramPlayerPushForUser(userId);
}

export async function applyMembershipSubscriptionFromStripe(params: {
  userId: string;
  subscription: Stripe.Subscription;
  organizationId?: string | null;
  orgJoinedAtSnapshot?: Date | null;
  previousLevel?: MembershipLevelKey | null;
  forceDeleted?: boolean;
}) {
  const stripePriceId = params.subscription.items.data[0]?.price.id ?? null;
  const levelFromPrice = mapStripePriceIdToMembershipLevel(stripePriceId);
  const levelFromMeta = parseMembershipLevelFromMetadata(
    params.subscription.metadata?.membershipLevel,
  );
  const level = levelFromPrice ?? levelFromMeta;
  if (!level) {
    return null;
  }

  const stripeCustomerId =
    typeof params.subscription.customer === "string"
      ? params.subscription.customer
      : params.subscription.customer?.id;
  if (!stripeCustomerId) {
    return null;
  }

  const currentPeriodEnd = getSubscriptionPeriodEnd(params.subscription);
  if (!currentPeriodEnd) {
    return null;
  }

  const existing = await prisma.membershipSubscription.findUnique({
    where: { userId: params.userId },
  });

  let pastDueGraceEndsAt = existing?.pastDueGraceEndsAt ?? null;
  const now = new Date();
  if (params.subscription.status === "past_due" || params.subscription.status === "unpaid") {
    if (!pastDueGraceEndsAt) {
      pastDueGraceEndsAt = graceEndFromNow(now);
    }
  } else if (params.subscription.status === "active" || params.subscription.status === "trialing") {
    pastDueGraceEndsAt = null;
  }

  const status = mapStripeSubscriptionStatus({
    stripeStatus: params.subscription.status,
    cancelAtPeriodEnd: params.subscription.cancel_at_period_end,
    deleted: Boolean(params.forceDeleted),
    pastDueGraceEndsAt,
    now,
  }) as SubscriptionStatus;

  const orgId =
    params.organizationId ??
    params.subscription.metadata?.organizationId?.trim() ??
    existing?.organizationId ??
    null;
  const orgJoinedAt =
    params.orgJoinedAtSnapshot ??
    (params.subscription.metadata?.orgJoinedAt
      ? new Date(params.subscription.metadata.orgJoinedAt)
      : null) ??
    existing?.orgJoinedAtSnapshot ??
    null;

  let pendingLevel = existing?.pendingLevel ?? null;
  let stripeScheduleId = existing?.stripeScheduleId ?? null;
  if (pendingLevel && levelFromPrice === pendingLevel) {
    pendingLevel = null;
    stripeScheduleId = null;
  }

  const record = await prisma.membershipSubscription.upsert({
    where: { userId: params.userId },
    create: {
      userId: params.userId,
      stripeCustomerId,
      stripeSubscriptionId: params.subscription.id,
      stripePriceId,
      stripeScheduleId,
      level,
      status,
      currentPeriodEnd,
      cancelAtPeriodEnd: params.subscription.cancel_at_period_end,
      pendingLevel,
      startedAt: existing?.startedAt ?? new Date(params.subscription.start_date * 1000),
      organizationId: orgId,
      orgJoinedAtSnapshot: orgJoinedAt,
      pastDueGraceEndsAt,
    },
    update: {
      stripeCustomerId,
      stripeSubscriptionId: params.subscription.id,
      stripePriceId,
      level,
      status,
      currentPeriodEnd,
      cancelAtPeriodEnd: params.subscription.cancel_at_period_end,
      pendingLevel,
      organizationId: orgId,
      orgJoinedAtSnapshot: orgJoinedAt,
      pastDueGraceEndsAt,
    },
  });

  if (status === "CANCELED") {
    await endAllAccessProgramIfNeeded(params.userId, record.level as MembershipLevelKey);
    await prisma.membershipSubscription.delete({ where: { userId: params.userId } }).catch(() => null);
    await syncUserDenormalizedFromSubscription(params.userId, {
      level: record.level,
      status: "CANCELED",
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
      stripeCustomerId,
      stripeSubscriptionId: params.subscription.id,
      stripePriceId,
      pastDueGraceEndsAt: null,
    });
    return null;
  }

  await syncUserDenormalizedFromSubscription(params.userId, {
    level: record.level,
    status: record.status,
    currentPeriodEnd: record.currentPeriodEnd,
    cancelAtPeriodEnd: record.cancelAtPeriodEnd,
    stripeCustomerId: record.stripeCustomerId,
    stripeSubscriptionId: record.stripeSubscriptionId,
    stripePriceId: record.stripePriceId,
    pastDueGraceEndsAt: record.pastDueGraceEndsAt,
  });

  const prev = params.previousLevel ?? (existing?.level as MembershipLevelKey | null) ?? null;
  if (subscriptionStatusGrantsAccess(record.status, {
    now,
    currentPeriodEnd: record.currentPeriodEnd,
    pastDueGraceEndsAt: record.pastDueGraceEndsAt,
  })) {
    await activateAllAccessIfNeeded(params.userId, record.level as MembershipLevelKey, prev);
  }

  if (record.cancelAtPeriodEnd && record.level === "ALL_ACCESS") {
    await ensureProgramEnrollmentForUser(params.userId);
  }

  return record;
}

export async function recordMembershipSubscriptionInvoice(params: {
  invoice: Stripe.Invoice;
  subscriptionId: string | null;
}) {
  const invoiceId = params.invoice.id;
  if (!invoiceId || params.invoice.status !== "paid") {
    return;
  }

  const existing = await prisma.membershipSubscriptionPayment.findUnique({
    where: { stripeInvoiceId: invoiceId },
    select: { id: true },
  });
  if (existing) {
    return;
  }

  const subRow = params.subscriptionId
    ? await prisma.membershipSubscription.findFirst({
        where: { stripeSubscriptionId: params.subscriptionId },
      })
    : null;

  const linePriceId = getInvoiceLinePriceId(params.invoice.lines?.data[0]);
  const level = mapStripePriceIdToMembershipLevel(linePriceId) ?? subRow?.level ?? null;

  await prisma.membershipSubscriptionPayment.create({
    data: {
      stripeInvoiceId: invoiceId,
      membershipSubscriptionId: subRow?.id ?? null,
      userId: subRow?.userId ?? null,
      level,
      amountCents: params.invoice.amount_paid ?? 0,
      currency: params.invoice.currency ?? "usd",
      paidAt: new Date((params.invoice.status_transitions?.paid_at ?? params.invoice.created) * 1000),
    },
  });
}

export async function handleMembershipInvoicePaymentFailed(params: {
  invoice: Stripe.Invoice;
  subscriptionId: string | null;
}) {
  if (!params.subscriptionId) {
    return;
  }
  const subRow = await prisma.membershipSubscription.findFirst({
    where: { stripeSubscriptionId: params.subscriptionId },
  });
  if (!subRow) {
    return;
  }

  const now = new Date();
  const pastDueGraceEndsAt = subRow.pastDueGraceEndsAt ?? graceEndFromNow(now);

  const updated = await prisma.membershipSubscription.update({
    where: { id: subRow.id },
    data: {
      status: "PAST_DUE",
      pastDueGraceEndsAt,
    },
  });

  await syncUserDenormalizedFromSubscription(subRow.userId, {
    level: updated.level,
    status: updated.status,
    currentPeriodEnd: updated.currentPeriodEnd,
    cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
    stripeCustomerId: updated.stripeCustomerId,
    stripeSubscriptionId: updated.stripeSubscriptionId,
    stripePriceId: updated.stripePriceId,
    pastDueGraceEndsAt: updated.pastDueGraceEndsAt,
  });
}

export async function clearPendingLevelAfterSchedule(userId: string) {
  await prisma.membershipSubscription.updateMany({
    where: { userId },
    data: { pendingLevel: null, stripeScheduleId: null },
  });
}
