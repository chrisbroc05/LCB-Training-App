export type MembershipPaymentCommissionReadiness = {
  userId: string | null;
  level: string | null;
  amountPaidCents: number;
};

export function isMembershipPaymentReadyForCommissionLedger(
  payment: MembershipPaymentCommissionReadiness,
): boolean {
  return payment.amountPaidCents > 0 && Boolean(payment.userId && payment.level);
}

/** Resolve member user id when invoice.paid arrives before MembershipSubscription exists. */
export function resolveMembershipPaymentUserId(params: {
  subscriptionUserId?: string | null;
  stripeCustomerUserId?: string | null;
  existingPaymentUserId?: string | null;
}): string | null {
  return (
    params.subscriptionUserId ??
    params.stripeCustomerUserId ??
    params.existingPaymentUserId ??
    null
  );
}
