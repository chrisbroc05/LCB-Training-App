import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseMembershipBillingInterval } from "@/lib/membership-billing-shared";
import {
  buildSwitchToAnnualModalContent,
  buildSwitchToMonthlyModalContent,
} from "@/lib/membership-change-shared";
import { formatMembershipBillingDate } from "@/lib/format-date";
import { prisma } from "@/lib/prisma";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import { requireCurrentTermsForCheckout } from "@/lib/legal-checkout-server";
import { switchMembershipBillingInterval } from "@/lib/stripe-membership-interval-server";

type Body = {
  interval?: string;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const termsError = await requireCurrentTermsForCheckout(session.user.id);
    if (termsError) {
      return termsError;
    }

    const body = (await request.json()) as Body;
    const targetInterval = parseMembershipBillingInterval(body.interval);
    const sub = await prisma.membershipSubscription.findUnique({
      where: { userId: session.user.id },
    });
    const level = (sub?.level ?? "CORE") as MembershipLevelKey;
    const result = await switchMembershipBillingInterval(session.user.id, targetInterval);
    const successMessage =
      targetInterval === "ANNUAL"
        ? buildSwitchToAnnualModalContent({
            level,
            amountDueTodayDisplay: "",
          }).successMessage
        : buildSwitchToMonthlyModalContent({
            level,
            annualThroughDateLabel: sub?.currentPeriodEnd
              ? formatMembershipBillingDate(sub.currentPeriodEnd)
              : "your renewal date",
          }).successMessage;
    return NextResponse.json({ success: true, successMessage, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[change-billing-interval]", message);
    return NextResponse.json({ error: message || "Unable to change billing interval." }, { status: 500 });
  }
}
