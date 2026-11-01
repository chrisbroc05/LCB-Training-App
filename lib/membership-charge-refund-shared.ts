/** Cumulative Stripe charge.amount_refunded capped to the original membership payment gross. */
export function resolveMembershipRefundAmountPaidCents(params: {
  chargeAmountRefundedCents: number;
  paymentAmountPaidCents: number;
}): number {
  const paymentGross = Math.abs(params.paymentAmountPaidCents);
  if (paymentGross <= 0) {
    return 0;
  }
  return Math.min(Math.abs(params.chargeAmountRefundedCents), paymentGross);
}

export function isMembershipPaymentFullyRefunded(params: {
  chargeAmountRefundedCents: number;
  paymentAmountPaidCents: number;
}): boolean {
  return (
    resolveMembershipRefundAmountPaidCents(params) >= Math.abs(params.paymentAmountPaidCents)
  );
}
