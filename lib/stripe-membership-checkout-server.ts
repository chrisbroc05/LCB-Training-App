import "server-only";

import type { MembershipBillingIntervalKey } from "@/lib/membership-billing-shared";
import {
  membershipLevelSupportsAnnualBilling,
  parseMembershipBillingInterval,
} from "@/lib/membership-billing-shared";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import {
  isMembershipLevelKey,
  isPublicMembershipLevelsEnabled,
} from "@/lib/membership-levels-shared";
import { resolveFoundingOfferForUserCheckout } from "@/lib/founding-offer-server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import {
  isAllAccessCheckoutAvailable,
  resolveOrgAttributionForCheckout,
} from "@/lib/membership-subscription-server";
import { resolveMembershipLevelStripePriceId } from "@/lib/stripe-membership-prices-server";
import { MEMBERSHIP_SUBSCRIPTION_BILLING_MODE } from "@/lib/stripe-membership-lifecycle-shared";

function getBaseUrl(request: Request) {
  const configuredBaseUrl = process.env.NEXTAUTH_URL;
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }
  const origin = request.headers.get("origin");
  if (origin) {
    return origin;
  }
  throw new Error("Unable to resolve app base URL for Stripe redirects.");
}

export async function createMembershipLevelCheckoutSession(params: {
  request: Request;
  userId: string;
  email: string;
  level: MembershipLevelKey;
  billingInterval?: MembershipBillingIntervalKey;
  orgJoinCode?: string | null;
}) {
  if (!isMembershipLevelKey(params.level)) {
    throw new Error("Invalid membership level.");
  }

  if (!isPublicMembershipLevelsEnabled()) {
    throw new Error("MEMBERSHIP_LEVELS_COMING_SOON");
  }

  if (params.level === "ALL_ACCESS") {
    const available = await isAllAccessCheckoutAvailable();
    if (!available) {
      throw new Error("ALL_ACCESS_CAP_FULL");
    }
  }

  const org = await resolveOrgAttributionForCheckout({
    userId: params.userId,
    orgJoinCode: params.orgJoinCode,
  });

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { stripeCustomerId: true },
  });

  const billingInterval = parseMembershipBillingInterval(params.billingInterval ?? "MONTHLY");
  if (billingInterval === "ANNUAL" && !membershipLevelSupportsAnnualBilling(params.level)) {
    throw new Error("Invalid billing interval for this level.");
  }
  if (params.level === "ALL_ACCESS" && billingInterval !== "MONTHLY") {
    throw new Error("All-Access is monthly only.");
  }

  const priceId = resolveMembershipLevelStripePriceId(params.level, billingInterval);
  if (!priceId) {
    throw new Error("MEMBERSHIP_PRICE_NOT_CONFIGURED");
  }
  const baseUrl = getBaseUrl(params.request);
  const stripe = getStripe();

  let customerId = user?.stripeCustomerId ?? null;
  if (customerId) {
    try {
      await stripe.customers.retrieve(customerId);
    } catch {
      customerId = null;
    }
  }

  const founding = await resolveFoundingOfferForUserCheckout({
    userId: params.userId,
    organizationId: org.organizationId,
    level: params.level,
    billingInterval,
  });

  const metadata: Record<string, string> = {
    userId: params.userId,
    membershipLevel: params.level,
    billingInterval,
    checkoutKind: "membership_level",
  };
  if (founding.foundingDiscountEndsAt) {
    metadata.foundingDiscountEndsAt = founding.foundingDiscountEndsAt.toISOString();
  }
  if (org.organizationId) {
    metadata.organizationId = org.organizationId;
  }
  if (org.orgJoinedAt) {
    metadata.orgJoinedAt = org.orgJoinedAt.toISOString();
  }

  const checkoutSuccessPath =
    params.level === "ALL_ACCESS"
      ? `${baseUrl}/program/start?checkout=membership-success`
      : `${baseUrl}/settings?checkout=membership-success`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    ...(customerId
      ? { customer: customerId }
      : { customer_email: params.email }),
    line_items: [{ price: priceId, quantity: 1 }],
    ...(founding.applyCoupon && founding.couponId
      ? { discounts: [{ coupon: founding.couponId }] }
      : {}),
    success_url: checkoutSuccessPath,
    cancel_url: `${baseUrl}/upgrade?checkout=canceled`,
    client_reference_id: params.userId,
    metadata,
    subscription_data: {
      metadata,
      billing_mode: MEMBERSHIP_SUBSCRIPTION_BILLING_MODE,
    },
  });

  if (!session.url) {
    throw new Error("Stripe checkout session missing URL.");
  }

  return session.url;
}
