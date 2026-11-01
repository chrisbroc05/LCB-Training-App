import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import type { StripeChargeFeeSnapshot } from "@/lib/stripe-charge-fee-shared";

export async function resolveStripeChargeFeeSnapshot(
  chargeId: string,
): Promise<StripeChargeFeeSnapshot> {
  const stripe = getStripe();
  const charge = await stripe.charges.retrieve(chargeId);
  const amountPaidCents = charge.amount;
  const balanceTransactionRef = charge.balance_transaction;
  if (!balanceTransactionRef) {
    return {
      chargeId,
      amountPaidCents,
      processingFeeCents: null,
      netCents: null,
      feePending: true,
    };
  }

  const balanceTransactionId =
    typeof balanceTransactionRef === "string"
      ? balanceTransactionRef
      : balanceTransactionRef.id;
  if (!balanceTransactionId) {
    return {
      chargeId,
      amountPaidCents,
      processingFeeCents: null,
      netCents: null,
      feePending: true,
    };
  }

  const balanceTransaction = await stripe.balanceTransactions.retrieve(balanceTransactionId);
  return {
    chargeId,
    amountPaidCents,
    processingFeeCents: balanceTransaction.fee,
    netCents: balanceTransaction.net,
    feePending: false,
  };
}

export async function resolvePaidInvoiceChargeId(invoiceId: string): Promise<string | null> {
  const stripe = getStripe();
  const invoice = await stripe.invoices.retrieve(invoiceId, {
    expand: ["payments.data.payment"],
  });
  const legacyCharge = (invoice as Stripe.Invoice & { charge?: string | Stripe.Charge | null })
    .charge;
  if (typeof legacyCharge === "string" && legacyCharge) {
    return legacyCharge;
  }
  if (legacyCharge && typeof legacyCharge === "object" && legacyCharge.id) {
    return legacyCharge.id;
  }

  for (const row of invoice.payments?.data ?? []) {
    if (row.status !== "paid") {
      continue;
    }
    const payment = row.payment;
    if (!payment || typeof payment === "string") {
      continue;
    }
    const chargeRef = (payment as { charge?: string | Stripe.Charge | null }).charge;
    if (typeof chargeRef === "string" && chargeRef) {
      return chargeRef;
    }
    if (chargeRef && typeof chargeRef === "object" && chargeRef.id) {
      return chargeRef.id;
    }
    const paymentIntentId = (payment as { payment_intent?: string | null }).payment_intent;
    if (typeof paymentIntentId === "string" && paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const latestCharge = paymentIntent.latest_charge;
      if (typeof latestCharge === "string" && latestCharge) {
        return latestCharge;
      }
      if (latestCharge && typeof latestCharge === "object" && latestCharge.id) {
        return latestCharge.id;
      }
    }
  }

  return null;
}

export async function resolvePaidInvoiceStripeFee(
  invoiceId: string,
  fallbackAmountPaidCents: number,
): Promise<StripeChargeFeeSnapshot> {
  const chargeId = await resolvePaidInvoiceChargeId(invoiceId);
  if (!chargeId) {
    return {
      chargeId: null,
      amountPaidCents: fallbackAmountPaidCents,
      processingFeeCents: null,
      netCents: null,
      feePending: true,
    };
  }
  const snapshot = await resolveStripeChargeFeeSnapshot(chargeId);
  if (snapshot.amountPaidCents <= 0) {
    return { ...snapshot, amountPaidCents: fallbackAmountPaidCents };
  }
  return snapshot;
}
