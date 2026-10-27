import type Stripe from "stripe";

export function getInvoiceLinePriceId(line: Stripe.InvoiceLineItem | undefined): string | null {
  if (!line) {
    return null;
  }
  const pricing = line as Stripe.InvoiceLineItem & {
    price?: { id?: string } | string | null;
    pricing?: { price_details?: { price?: string } };
  };
  if (typeof pricing.price === "string") {
    return pricing.price;
  }
  if (pricing.price && typeof pricing.price === "object" && pricing.price.id) {
    return pricing.price.id;
  }
  const detailsPrice = pricing.pricing?.price_details?.price;
  if (typeof detailsPrice === "string" && detailsPrice.startsWith("price_")) {
    return detailsPrice;
  }
  return null;
}
