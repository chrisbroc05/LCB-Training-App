import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isPublicMembershipLevelsEnabled } from "@/lib/membership-levels-shared";
import { requireCurrentTermsForCheckout } from "@/lib/legal-checkout-server";
import { createExtraReviewCheckoutSession } from "@/lib/stripe-extra-review-checkout-server";

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
      return NextResponse.json({ error: "Extra reviews are not available yet." }, { status: 503 });
    }

    const url = await createExtraReviewCheckoutSession({
      request,
      userId: session.user.id,
      email: session.user.email,
    });
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === "STRIPE_PRICE_EXTRA_REVIEW_NOT_CONFIGURED") {
      return NextResponse.json({ error: "Checkout is not configured." }, { status: 503 });
    }
    return NextResponse.json({ error: message || "Unable to start checkout." }, { status: 400 });
  }
}
