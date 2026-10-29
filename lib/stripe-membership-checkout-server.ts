import "server-only";

import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import {
  isMembershipLevelKey,
  isPublicMembershipLevelsEnabled,
} from "@/lib/membership-levels-shared";
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

  const priceId = resolveMembershipLevelStripePriceId(params.level);
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

  const metadata: Record<string, string> = {
    userId: params.userId,
    membershipLevel: params.level,
    checkoutKind: "membership_level",
  };
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
    success_url: checkoutSuccessPath,
    cancel_url: `${baseUrl}/upgrade?checkout=cancelled`,
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

  await prisma.user.update({
    where: { id: params.userId },
    data: { pendingCheckoutLevel: params.level },
  });

  return session.url;
}
