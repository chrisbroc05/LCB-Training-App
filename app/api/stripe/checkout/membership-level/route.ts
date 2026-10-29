import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  isMembershipLevelKey,
  isPublicMembershipLevelsEnabled,
  MEMBERSHIP_LEVELS_COMING_SOON_MESSAGE,
} from "@/lib/membership-levels-shared";
import { requireCurrentTermsForCheckout } from "@/lib/legal-checkout-server";
import { createMembershipLevelCheckoutSession } from "@/lib/stripe-membership-checkout-server";

type Body = {
  level?: string;
  orgJoinCode?: string;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const termsError = await requireCurrentTermsForCheckout(session.user.id);
    if (termsError) {
      return termsError;
    }

    if (!isPublicMembershipLevelsEnabled()) {
      return NextResponse.json(
        { error: MEMBERSHIP_LEVELS_COMING_SOON_MESSAGE, code: "MEMBERSHIP_LEVELS_COMING_SOON" },
        { status: 503 },
      );
    }

    const body = (await request.json()) as Body;
    const levelRaw = body.level?.trim().toUpperCase() ?? "";
    if (!isMembershipLevelKey(levelRaw)) {
      return NextResponse.json({ error: "Choose Core, Plus, or All-Access." }, { status: 400 });
    }

    const url = await createMembershipLevelCheckoutSession({
      request,
      userId: session.user.id,
      email: session.user.email,
      level: levelRaw,
      orgJoinCode: body.orgJoinCode,
    });

    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === "ALL_ACCESS_CAP_FULL") {
      return NextResponse.json(
        { error: "All-Access is full right now. Join the waitlist instead.", code: "ALL_ACCESS_CAP_FULL" },
        { status: 409 },
      );
    }
    if (message === "MEMBERSHIP_LEVELS_COMING_SOON") {
      return NextResponse.json(
        { error: MEMBERSHIP_LEVELS_COMING_SOON_MESSAGE, code: "MEMBERSHIP_LEVELS_COMING_SOON" },
        { status: 503 },
      );
    }
    if (message === "MEMBERSHIP_PRICE_NOT_CONFIGURED" || message.startsWith("MEMBERSHIP_PRICE_NOT_CONFIGURED:")) {
      return NextResponse.json(
        {
          error: "Membership checkout is not available right now. Please try again later.",
          code: "MEMBERSHIP_PRICE_NOT_CONFIGURED",
        },
        { status: 503 },
      );
    }
    if (message.includes("organization") || message.includes("Organization")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("[membership-level-checkout]", message);
    return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
  }
}
