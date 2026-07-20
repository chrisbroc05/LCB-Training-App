import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

function getAppUrl() {
  return process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      stripeCustomerId: true,
      membershipTier: true,
      stripeSubscriptionId: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (user.membershipTier !== "MEMORABLE" && user.membershipTier !== "ELITE") {
    return NextResponse.json(
      { error: "Billing management is available for Memorable and Elite members only." },
      { status: 403 },
    );
  }

  if (!user.stripeCustomerId) {
    return NextResponse.json(
      { error: "No Stripe customer account was found for this user." },
      { status: 400 },
    );
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${getAppUrl()}/settings`,
  });

  if (!portalSession.url) {
    return NextResponse.json({ error: "Unable to open billing portal right now." }, { status: 500 });
  }

  return NextResponse.json({ url: portalSession.url });
}
