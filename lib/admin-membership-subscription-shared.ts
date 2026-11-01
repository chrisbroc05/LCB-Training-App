import {
  getMembershipBilledPriceDisplay,
  type MembershipBillingIntervalKey,
} from "@/lib/membership-billing-shared";
import {
  annualMembershipPaymentEligibleUntil,
  isAnnualMembershipPaymentBilling,
  isRefundableAnnualMembershipPayment,
  listRefundableAnnualMembershipPayments,
  type AnnualMembershipPaymentRefundFields,
} from "@/lib/membership-annual-refund-shared";
import {
  buildPendingBillingIntervalNotice,
  buildPendingCancelNotice,
  buildPendingDowngradeNotice,
  formatMembershipSubscriptionStatusLabel,
  formatUsdFromCents,
} from "@/lib/membership-change-shared";
import { formatMembershipLevelLabel, type MembershipLevelKey } from "@/lib/membership-levels-shared";
import { FOUNDING_PLUS_MONTHLY_DISCOUNT_DISPLAY } from "@/lib/founding-offer-shared";
import { formatDateWithYear } from "@/lib/format-date";

export type AdminMembershipSubscriptionPaymentSummary = AnnualMembershipPaymentRefundFields & {
  id: string;
};

export function isFoundingPlusMonthlyDiscountActive(params: {
  level: MembershipLevelKey;
  billingInterval: MembershipBillingIntervalKey;
  foundingDiscountEndsAt: Date | string | null | undefined;
  now?: Date;
}): boolean {
  const now = params.now ?? new Date();
  if (params.level !== "PLUS" || params.billingInterval !== "MONTHLY") {
    return false;
  }
  if (!params.foundingDiscountEndsAt) {
    return false;
  }
  return new Date(params.foundingDiscountEndsAt).getTime() > now.getTime();
}

export function buildAdminMembershipBillingLine(params: {
  level: MembershipLevelKey;
  billingInterval: MembershipBillingIntervalKey;
  foundingDiscountEndsAt?: Date | string | null;
  now?: Date;
}): string {
  const intervalLabel = params.billingInterval === "ANNUAL" ? "Annual" : "Monthly";
  const price = getMembershipBilledPriceDisplay({
    level: params.level,
    billingInterval: params.billingInterval,
    foundingPlusMonthlyActive: isFoundingPlusMonthlyDiscountActive({
      level: params.level,
      billingInterval: params.billingInterval,
      foundingDiscountEndsAt: params.foundingDiscountEndsAt,
      now: params.now,
    }),
  });
  return `Billing: ${intervalLabel} (${price})`;
}

export function buildAdminMembershipFoundingDiscountLine(params: {
  level: MembershipLevelKey;
  billingInterval: MembershipBillingIntervalKey;
  foundingDiscountEndsAt: Date | string | null | undefined;
  now?: Date;
}): string | null {
  if (
    !isFoundingPlusMonthlyDiscountActive({
      level: params.level,
      billingInterval: params.billingInterval,
      foundingDiscountEndsAt: params.foundingDiscountEndsAt,
      now: params.now,
    })
  ) {
    return null;
  }
  return `${FOUNDING_PLUS_MONTHLY_DISCOUNT_DISPLAY} (through ${formatDateWithYear(params.foundingDiscountEndsAt)}).`;
}

export function buildAdminMembershipPendingChangeNotices(params: {
  level: MembershipLevelKey;
  billingInterval: MembershipBillingIntervalKey;
  cancelAtPeriodEnd: boolean;
  pendingLevel: MembershipLevelKey | null;
  pendingBillingInterval: MembershipBillingIntervalKey | null;
  currentPeriodEndLabel: string;
}): string[] {
  const notices: string[] = [];
  if (params.cancelAtPeriodEnd) {
    notices.push(buildPendingCancelNotice({ accessEndsLabel: params.currentPeriodEndLabel }));
  }
  if (params.pendingLevel && !params.cancelAtPeriodEnd) {
    notices.push(
      buildPendingDowngradeNotice({
        currentLevel: params.level,
        targetLevel: params.pendingLevel,
        effectiveDateLabel: params.currentPeriodEndLabel,
      }),
    );
  }
  if (params.pendingBillingInterval) {
    notices.push(
      buildPendingBillingIntervalNotice({
        pendingInterval: params.pendingBillingInterval,
        effectiveDateLabel: params.currentPeriodEndLabel,
      }),
    );
  }
  return notices;
}

export function isEndedMembershipSubscriptionStatus(status: string): boolean {
  return status === "CANCELED" || status === "EXPIRED";
}

export function buildMembershipSubscriptionEndedLabels(params: {
  status: string;
  accessEndedAt: Date | string | null | undefined;
  now?: Date;
}): { showNextBilling: boolean; canceledOnLabel: string | null } {
  if (!isEndedMembershipSubscriptionStatus(params.status)) {
    return { showNextBilling: true, canceledOnLabel: null };
  }
  const canceledAt = params.accessEndedAt
    ? new Date(params.accessEndedAt)
    : (params.now ?? new Date());
  return {
    showNextBilling: false,
    canceledOnLabel: `Canceled on ${formatDateWithYear(canceledAt)}`,
  };
}

export type AdminAnnualMembershipRefundSummary = {
  canRefund: boolean;
  refundWindowLabel: string | null;
  refundLines: string[];
  totalRefundableCents: number;
  confirmMessage: string;
};

export function buildAdminAnnualMembershipRefundSummary(params: {
  subscriptionBillingInterval: MembershipBillingIntervalKey;
  subscriptionStatus: string;
  accessEndedAt?: Date | string | null;
  payments: AdminMembershipSubscriptionPaymentSummary[];
  memberDisplayName: string;
  now?: Date;
}): AdminAnnualMembershipRefundSummary | null {
  if (params.subscriptionBillingInterval !== "ANNUAL") {
    return null;
  }

  const now = params.now ?? new Date();
  const subscriptionInterval = params.subscriptionBillingInterval;
  const annualPayments = params.payments.filter((payment) =>
    isAnnualMembershipPaymentBilling(payment, subscriptionInterval),
  );
  if (annualPayments.length === 0) {
    return null;
  }

  const refundedPayments = annualPayments.filter((payment) => payment.refundedAt);
  const ended = isEndedMembershipSubscriptionStatus(params.subscriptionStatus);

  if (ended || refundedPayments.length > 0) {
    const refundLines = [...refundedPayments]
      .sort(
        (a, b) =>
          new Date(a.refundedAt!).getTime() - new Date(b.refundedAt!).getTime(),
      )
      .map(
        (payment) =>
          `Refunded ${formatUsdFromCents(payment.amountPaidCents)} on ${formatDateWithYear(payment.refundedAt!)}`,
      );

    return {
      canRefund: false,
      refundWindowLabel: null,
      refundLines,
      totalRefundableCents: 0,
      confirmMessage: "",
    };
  }

  const refundable = listRefundableAnnualMembershipPayments(annualPayments, now, subscriptionInterval);
  const totalRefundableCents = refundable.reduce(
    (sum, payment) => sum + payment.amountPaidCents,
    0,
  );

  if (refundable.length > 0) {
    const windowEndsAt = refundable.reduce((latest, payment) => {
      const until = annualMembershipPaymentEligibleUntil(payment);
      return until.getTime() > latest.getTime() ? until : latest;
    }, annualMembershipPaymentEligibleUntil(refundable[0]!));

    const totalDisplay = formatUsdFromCents(totalRefundableCents);
    return {
      canRefund: totalRefundableCents > 0,
      refundWindowLabel: `Refund window ends ${formatDateWithYear(windowEndsAt)}`,
      refundLines: [],
      totalRefundableCents,
      confirmMessage: `Refund ${totalDisplay} to ${params.memberDisplayName} and end their membership now? This can't be undone.`,
    };
  }

  const latestPayment = [...annualPayments].sort(
    (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
  )[0]!;
  const closedOn = annualMembershipPaymentEligibleUntil(latestPayment);

  return {
    canRefund: false,
    refundWindowLabel: `Refund window closed on ${formatDateWithYear(closedOn)}`,
    refundLines: [],
    totalRefundableCents: 0,
    confirmMessage: "",
  };
}

export function buildAdminMembershipSubscriptionStatusLabel(params: {
  status: string;
  cancelAtPeriodEnd: boolean;
  pendingLevel: MembershipLevelKey | null;
  currentPeriodEndLabel: string;
}): string {
  return formatMembershipSubscriptionStatusLabel({
    status: params.status,
    cancelAtPeriodEnd: params.cancelAtPeriodEnd,
    pendingLevel: params.pendingLevel,
    nextBillingLabel: params.currentPeriodEndLabel,
  });
}
