import type Stripe from "stripe";

export function getStripeInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = (invoice as Stripe.Invoice & { subscription?: string | null }).subscription;
  if (typeof legacy === "string" && legacy) {
    return legacy;
  }

  const parent = invoice.parent;
  if (parent?.type === "subscription_details") {
    const subscription = parent.subscription_details?.subscription;
    if (typeof subscription === "string" && subscription) {
      return subscription;
    }
    if (subscription && typeof subscription === "object" && "id" in subscription) {
      const id = (subscription as { id?: string }).id;
      if (id) {
        return id;
      }
    }
  }

  return null;
}

export function mapStripeInvoiceLinesForMembership(
  lines: Stripe.InvoiceLineItem[] | undefined,
): Array<{ amount: number | null; priceId: string | null }> {
  return (lines ?? []).map((line) => ({
    amount: line.amount ?? null,
    priceId: getInvoiceLinePriceId(line),
  }));
}

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
