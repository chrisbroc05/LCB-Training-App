import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import { formatMembershipLevelLabel, MEMBERSHIP_LEVELS } from "@/lib/membership-levels-shared";
export const MEMBERSHIP_UPGRADE_PRORATION_BEHAVIOR = "always_invoice" as const;
export const MEMBERSHIP_UPGRADE_PAYMENT_BEHAVIOR = "error_if_incomplete" as const;

export function buildMembershipUpgradeStripeUpdateOptions() {
  return {
    proration_behavior: MEMBERSHIP_UPGRADE_PRORATION_BEHAVIOR,
    payment_behavior: MEMBERSHIP_UPGRADE_PAYMENT_BEHAVIOR,
    cancel_at_period_end: false,
  } as const;
}

export function shouldApplyMembershipLevelUpgrade(params: {
  stripeSubscriptionStatus: string;
  latestInvoiceStatus: string | null | undefined;
}): boolean {
  const blockedSubStatuses = new Set(["incomplete", "incomplete_expired", "past_due", "unpaid"]);
  if (blockedSubStatuses.has(params.stripeSubscriptionStatus)) {
    return false;
  }
  const invoiceStatus = params.latestInvoiceStatus?.toLowerCase() ?? "";
  if (invoiceStatus === "open" || invoiceStatus === "draft" || invoiceStatus === "uncollectible") {
    return false;
  }
  return true;
}

export function formatMembershipUpgradePaymentError(fallbackCurrentLevel: MembershipLevelKey): string {
  return `Your card could not be charged for this upgrade. You are still on ${formatMembershipLevelLabel(fallbackCurrentLevel)}. Update your payment method in Manage billing and try again.`;
}

export function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function buildUpgradeConfirmMessage(params: {
  targetLevel: MembershipLevelKey;
  amountDueTodayDisplay: string;
  nextBillingLabel: string;
}): string {
  const targetLabel = formatMembershipLevelLabel(params.targetLevel);
  const recurring = MEMBERSHIP_LEVELS[params.targetLevel].priceDisplay;
  return `Upgrade to ${targetLabel}? You'll be charged ${params.amountDueTodayDisplay} today for the rest of this billing period, then ${recurring} starting ${params.nextBillingLabel}.`;
}

export function buildDowngradeConfirmMessage(params: {
  currentLevel: MembershipLevelKey;
  targetLevel: MembershipLevelKey;
  effectiveDateLabel: string;
}): string {
  const currentLabel = formatMembershipLevelLabel(params.currentLevel);
  const targetLabel = formatMembershipLevelLabel(params.targetLevel);
  const recurring = MEMBERSHIP_LEVELS[params.targetLevel].priceDisplay;
  return `Downgrade to ${targetLabel}? You'll keep ${currentLabel} until ${params.effectiveDateLabel}, then switch to ${targetLabel} at ${recurring}.`;
}

export function buildCancelMembershipConfirmMessage(params: { accessEndsLabel: string }): string {
  return `Cancel membership? You'll keep access until ${params.accessEndsLabel}. No more charges after that.`;
}

export type PlanChangeModalContent = {
  kind: "upgrade" | "downgrade" | "cancel";
  title: string;
  body: string;
  confirmLabel: string;
  dismissLabel: string;
  successMessage: string;
};

export function buildUpgradeModalContent(params: {
  targetLevel: MembershipLevelKey;
  amountDueTodayDisplay: string;
  nextBillingLabel: string;
}): PlanChangeModalContent {
  const targetLabel = formatMembershipLevelLabel(params.targetLevel);
  const recurring = MEMBERSHIP_LEVELS[params.targetLevel].priceDisplay;
  return {
    kind: "upgrade",
    title: `Upgrade to ${targetLabel}`,
    body: `You'll be charged ${params.amountDueTodayDisplay} today for the rest of this billing period. Then it's ${recurring} starting ${params.nextBillingLabel}.`,
    confirmLabel: "Upgrade now",
    dismissLabel: "Not now",
    successMessage: `You're on ${targetLabel} now.`,
  };
}

export function buildDowngradeModalContent(params: {
  currentLevel: MembershipLevelKey;
  targetLevel: MembershipLevelKey;
  effectiveDateLabel: string;
}): PlanChangeModalContent {
  const currentLabel = formatMembershipLevelLabel(params.currentLevel);
  const targetLabel = formatMembershipLevelLabel(params.targetLevel);
  const recurring = MEMBERSHIP_LEVELS[params.targetLevel].priceDisplay;
  return {
    kind: "downgrade",
    title: `Switch to ${targetLabel}`,
    body: `You'll keep ${currentLabel} until ${params.effectiveDateLabel}. After that, you'll switch to ${targetLabel} at ${recurring}. You won't be charged anything today.`,
    confirmLabel: `Switch to ${targetLabel}`,
    dismissLabel: `Keep ${currentLabel}`,
    successMessage: `Done. You'll switch to ${targetLabel} on ${params.effectiveDateLabel}.`,
  };
}

export function buildCancelModalContent(params: {
  currentLevel: MembershipLevelKey;
  accessEndsLabel: string;
}): PlanChangeModalContent {
  const currentLabel = formatMembershipLevelLabel(params.currentLevel);
  return {
    kind: "cancel",
    title: "Cancel membership",
    body: `You'll keep ${currentLabel} until ${params.accessEndsLabel}. You won't be charged again after that.`,
    confirmLabel: "Cancel membership",
    dismissLabel: "Keep my membership",
    successMessage: `Your membership will end on ${params.accessEndsLabel}.`,
  };
}

export function buildPendingDowngradeNotice(params: {
  currentLevel: MembershipLevelKey;
  targetLevel: MembershipLevelKey;
  effectiveDateLabel: string;
}): string {
  const currentLabel = formatMembershipLevelLabel(params.currentLevel);
  const targetLabel = formatMembershipLevelLabel(params.targetLevel);
  return `Switching to ${targetLabel} on ${params.effectiveDateLabel}. You have ${currentLabel} until then.`;
}

export function buildPendingCancelNotice(params: { accessEndsLabel: string }): string {
  return `Your membership ends ${params.accessEndsLabel}.`;
}

export function buildKeepCurrentPlanSuccessMessage(currentLevel: MembershipLevelKey): string {
  return `Your scheduled switch was canceled. You're staying on ${formatMembershipLevelLabel(currentLevel)}.`;
}

export function buildResumeMembershipSuccessMessage(currentLevel: MembershipLevelKey): string {
  return `Your ${formatMembershipLevelLabel(currentLevel)} membership will continue.`;
}

export type MembershipSubscriptionStatusDisplayInput = {
  status: string;
  cancelAtPeriodEnd: boolean;
  pendingLevel: MembershipLevelKey | null;
  nextBillingLabel: string;
};

export function formatMembershipSubscriptionStatusLabel(
  input: MembershipSubscriptionStatusDisplayInput,
): string {
  if (input.status === "PAST_DUE") {
    return "Payment issue";
  }
  if (input.status === "CANCELED" || input.status === "NONE") {
    return "Canceled";
  }
  if (input.cancelAtPeriodEnd || input.status === "CANCEL_AT_PERIOD_END") {
    return `Canceling ${input.nextBillingLabel}`;
  }
  if (input.pendingLevel) {
    return "Active";
  }
  if (input.status === "ACTIVE") {
    return "Active";
  }
  return "Active";
}
