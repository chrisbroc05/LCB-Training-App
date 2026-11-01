export const ANNUAL_MEMBERSHIP_REFUND_WINDOW_DAYS = 14;

export function computeAnnualRefundEligibleUntil(paidAt: Date): Date {
  const until = new Date(paidAt);
  until.setUTCDate(until.getUTCDate() + ANNUAL_MEMBERSHIP_REFUND_WINDOW_DAYS);
  return until;
}

export function isWithinAnnualMembershipRefundWindow(
  paidAt: Date,
  now: Date = new Date(),
): boolean {
  const until = computeAnnualRefundEligibleUntil(paidAt);
  return now.getTime() <= until.getTime();
}

export type AnnualMembershipPaymentRefundFields = {
  billingInterval?: string | null;
  paidAt: Date | string;
  annualRefundEligibleUntil?: Date | string | null;
  refundedAt?: Date | string | null;
  amountPaidCents: number;
  invoiceBillingReason?: string | null;
};

export function annualMembershipPaymentEligibleUntil(
  payment: Pick<AnnualMembershipPaymentRefundFields, "paidAt" | "annualRefundEligibleUntil">,
): Date {
  if (payment.annualRefundEligibleUntil) {
    return new Date(payment.annualRefundEligibleUntil);
  }
  return computeAnnualRefundEligibleUntil(new Date(payment.paidAt));
}

export function isAnnualMembershipPaymentBilling(
  payment: Pick<
    AnnualMembershipPaymentRefundFields,
    "billingInterval" | "invoiceBillingReason" | "amountPaidCents" | "annualRefundEligibleUntil"
  >,
  subscriptionBillingInterval?: string | null,
): boolean {
  const interval = payment.billingInterval?.trim().toUpperCase();
  if (interval === "ANNUAL") {
    return true;
  }
  if (interval === "MONTHLY") {
    const subInterval = subscriptionBillingInterval?.trim().toUpperCase();
    if (subInterval === "ANNUAL" && payment.amountPaidCents > 0) {
      if (payment.annualRefundEligibleUntil) {
        return true;
      }
      if (payment.invoiceBillingReason === "subscription_update") {
        return true;
      }
    }
    return false;
  }
  const subInterval = subscriptionBillingInterval?.trim().toUpperCase();
  return !interval || interval === "ANNUAL" || subInterval === "ANNUAL";
}

export function isRefundableAnnualMembershipPayment(
  payment: AnnualMembershipPaymentRefundFields,
  now: Date = new Date(),
  subscriptionBillingInterval?: string | null,
): boolean {
  if (payment.refundedAt) {
    return false;
  }
  if (!isAnnualMembershipPaymentBilling(payment, subscriptionBillingInterval)) {
    return false;
  }
  return now.getTime() <= annualMembershipPaymentEligibleUntil(payment).getTime();
}

export function listRefundableAnnualMembershipPayments<T extends AnnualMembershipPaymentRefundFields>(
  payments: T[],
  now: Date = new Date(),
  subscriptionBillingInterval?: string | null,
): T[] {
  return payments.filter((payment) =>
    isRefundableAnnualMembershipPayment(payment, now, subscriptionBillingInterval),
  );
}
