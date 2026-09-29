import { formatDateWithYear } from "@/lib/format-date";

export type StripeRefundProduct = "twelve_week_program" | "playbook";

export function formatRefundAmount(amountCents: number, currency = "usd") {
  const normalizedCurrency = currency.trim().toLowerCase() || "usd";
  const amount = amountCents / 100;

  if (normalizedCurrency === "usd") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  return `${amount.toFixed(2)} ${normalizedCurrency.toUpperCase()}`;
}

export function formatRefundLabel(
  refundedAt: Date | string,
  amountCents: number,
  currency = "usd",
) {
  return `Refunded on ${formatDateWithYear(refundedAt)}, ${formatRefundAmount(amountCents, currency)}`;
}
