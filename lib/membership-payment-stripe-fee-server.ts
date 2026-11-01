import { prisma } from "@/lib/prisma";
import { resolvePaidInvoiceStripeFee } from "@/lib/stripe-charge-fee-server";

export async function syncMembershipPaymentStripeFeeFromInvoice(params: {
  stripeInvoiceId: string;
  fallbackAmountPaidCents: number;
}) {
  const feeSnapshot = await resolvePaidInvoiceStripeFee(
    params.stripeInvoiceId,
    params.fallbackAmountPaidCents,
  );

  await prisma.membershipSubscriptionPayment.updateMany({
    where: { stripeInvoiceId: params.stripeInvoiceId },
    data: {
      amountPaidCents: feeSnapshot.amountPaidCents,
      processingFeeCents: feeSnapshot.processingFeeCents,
      netCents: feeSnapshot.netCents,
      stripeChargeId: feeSnapshot.chargeId,
      commissionFeePending: feeSnapshot.feePending,
    },
  });

  return feeSnapshot;
}

export async function runPendingCommissionFeeResolution(params: { limit?: number } = {}) {
  const { ensureCommissionLedgerForMembershipPayment } = await import(
    "@/lib/commission-ledger-server"
  );

  const pending = await prisma.membershipSubscriptionPayment.findMany({
    where: { commissionFeePending: true },
    orderBy: { paidAt: "asc" },
    take: params.limit ?? 40,
    select: { stripeInvoiceId: true, amountPaidCents: true },
  });

  let resolved = 0;
  let stillPending = 0;

  const errors: string[] = [];

  for (const payment of pending) {
    try {
      await syncMembershipPaymentStripeFeeFromInvoice({
        stripeInvoiceId: payment.stripeInvoiceId,
        fallbackAmountPaidCents: payment.amountPaidCents,
      });
      await ensureCommissionLedgerForMembershipPayment({
        stripeInvoiceId: payment.stripeInvoiceId,
      });
      const updated = await prisma.membershipSubscriptionPayment.findUnique({
        where: { stripeInvoiceId: payment.stripeInvoiceId },
        select: { commissionFeePending: true },
      });
      if (updated?.commissionFeePending) {
        stillPending += 1;
      } else {
        resolved += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${payment.stripeInvoiceId}: ${message}`);
      stillPending += 1;
    }
  }

  return { scanned: pending.length, resolved, stillPending, errors };
}
