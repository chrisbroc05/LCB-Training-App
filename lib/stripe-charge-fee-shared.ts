export type StripeChargeFeeSnapshot = {
  chargeId: string | null;
  amountPaidCents: number;
  processingFeeCents: number | null;
  netCents: number | null;
  feePending: boolean;
};

export function computeNetCentsFromPaidAndFee(
  amountPaidCents: number,
  processingFeeCents: number,
): number {
  return amountPaidCents - processingFeeCents;
}
