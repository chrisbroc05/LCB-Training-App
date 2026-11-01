import "server-only";

import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import {
  chicagoMonthKey,
  chicagoWeekKey,
  extraReviewExpiresAt,
  EXTRA_REVIEW_MAX_PER_MONTH,
  EXTRA_REVIEW_MAX_PER_WEEK,
  nextChicagoCalendarMonthStartInstant,
  nextChicagoWeekStartInstant,
  type ExtraReviewPurchaseBlockReason,
} from "@/lib/extra-review-shared";

export async function countExtraReviewPurchasesInWeek(userId: string, now: Date = new Date()) {
  const weekKey = chicagoWeekKey(now);
  const weekStart = new Date(`${weekKey}T06:00:00.000Z`);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  return prisma.extraReviewCredit.count({
    where: { userId, purchasedAt: { gte: weekStart, lt: weekEnd } },
  });
}

export async function countExtraReviewPurchasesInMonth(userId: string, now: Date = new Date()) {
  const monthKey = chicagoMonthKey(now);
  const [year, month] = monthKey.split("-").map(Number);
  const monthStart = new Date(Date.UTC(year!, month! - 1, 1, 6));
  const monthEnd = new Date(Date.UTC(year!, month!, 1, 6));
  return prisma.extraReviewCredit.count({
    where: { userId, purchasedAt: { gte: monthStart, lt: monthEnd } },
  });
}

export async function countUnusedExtraReviewCredits(userId: string, now: Date = new Date()) {
  return prisma.extraReviewCredit.count({
    where: {
      userId,
      usedAt: null,
      expiresAt: { gt: now },
    },
  });
}

export async function canPurchaseExtraReview(userId: string, now: Date = new Date()) {
  const [weekCount, monthCount] = await Promise.all([
    countExtraReviewPurchasesInWeek(userId, now),
    countExtraReviewPurchasesInMonth(userId, now),
  ]);
  if (weekCount >= EXTRA_REVIEW_MAX_PER_WEEK) {
    return {
      ok: false as const,
      reason: "You can buy one extra review per week." as const,
      blockReason: "week" as ExtraReviewPurchaseBlockReason,
      nextEligibleAt: nextChicagoWeekStartInstant(now),
    };
  }
  if (monthCount >= EXTRA_REVIEW_MAX_PER_MONTH) {
    return {
      ok: false as const,
      reason: "You can buy up to two extra reviews per month." as const,
      blockReason: "month" as ExtraReviewPurchaseBlockReason,
      nextEligibleAt: nextChicagoCalendarMonthStartInstant(now),
    };
  }
  return { ok: true as const };
}

export async function loadExtraReviewUiState(userId: string, now: Date = new Date()) {
  const [unusedCredits, purchase, nextUnusedCredit] = await Promise.all([
    countUnusedExtraReviewCredits(userId, now),
    canPurchaseExtraReview(userId, now),
    prisma.extraReviewCredit.findFirst({
      where: { userId, usedAt: null, expiresAt: { gt: now } },
      orderBy: { expiresAt: "asc" },
      select: { expiresAt: true },
    }),
  ]);

  return {
    unusedCredits,
    nextCreditExpiresAt: nextUnusedCredit?.expiresAt ?? null,
    canPurchase: purchase.ok,
    blockReason: purchase.ok ? null : purchase.blockReason,
    nextPurchaseEligibleAt: purchase.ok ? null : purchase.nextEligibleAt,
  };
}

export type ConfirmExtraReviewCheckoutResult =
  | { ok: true; creditId: string; alreadyGranted: boolean }
  | { ok: false; reason: "not_paid" | "wrong_kind" | "user_mismatch" | "invalid_session" };

export async function confirmExtraReviewCheckoutSession(params: {
  userId: string;
  stripeCheckoutSessionId: string;
}): Promise<ConfirmExtraReviewCheckoutResult> {
  const sessionId = params.stripeCheckoutSessionId.trim();
  if (!sessionId.startsWith("cs_")) {
    return { ok: false, reason: "invalid_session" };
  }

  const stripe = getStripe();
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return { ok: false, reason: "invalid_session" };
  }

  if (session.payment_status !== "paid") {
    return { ok: false, reason: "not_paid" };
  }
  if (session.metadata?.checkoutKind !== "extra_review") {
    return { ok: false, reason: "wrong_kind" };
  }

  const ownerId =
    session.metadata?.userId?.trim() ||
    (typeof session.client_reference_id === "string" ? session.client_reference_id.trim() : null);
  if (!ownerId || ownerId !== params.userId) {
    return { ok: false, reason: "user_mismatch" };
  }

  const existing = await prisma.extraReviewCredit.findUnique({
    where: { stripeCheckoutSessionId: session.id },
    select: { id: true },
  });
  const credit = await grantExtraReviewCreditFromCheckout({
    userId: params.userId,
    stripeCheckoutSessionId: session.id,
    purchasedAt: session.created ? new Date(session.created * 1000) : undefined,
  });

  return {
    ok: true,
    creditId: credit.id,
    alreadyGranted: Boolean(existing),
  };
}

export async function grantExtraReviewCreditFromCheckout(params: {
  userId: string;
  stripeCheckoutSessionId: string;
  purchasedAt?: Date;
}) {
  const existing = await prisma.extraReviewCredit.findUnique({
    where: { stripeCheckoutSessionId: params.stripeCheckoutSessionId },
  });
  if (existing) {
    return existing;
  }
  const purchasedAt = params.purchasedAt ?? new Date();
  return prisma.extraReviewCredit.create({
    data: {
      userId: params.userId,
      purchasedAt,
      expiresAt: extraReviewExpiresAt(purchasedAt),
      stripeCheckoutSessionId: params.stripeCheckoutSessionId,
    },
  });
}
