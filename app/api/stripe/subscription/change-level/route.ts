import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isMembershipLevelKey, type MembershipLevelKey } from "@/lib/membership-levels-shared";
import {
  buildDowngradeModalContent,
  buildUpgradeModalContent,
} from "@/lib/membership-change-shared";
import { formatMembershipBillingDate } from "@/lib/format-date";
import { requireCurrentTermsForCheckout } from "@/lib/legal-checkout-server";
import {
  isMembershipLevelDowngrade,
  isMembershipLevelUpgrade,
} from "@/lib/membership-subscription-shared";
import { prisma } from "@/lib/prisma";
import {
  scheduleMembershipDowngrade,
  upgradeMembershipLevel,
} from "@/lib/stripe-membership-change-server";

type Body = {
  level?: string;
  action?: "upgrade" | "downgrade";
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
    const targetRaw = body.level?.trim().toUpperCase() ?? "";
    if (!isMembershipLevelKey(targetRaw)) {
      return NextResponse.json({ error: "Invalid membership level." }, { status: 400 });
    }

    const sub = await prisma.membershipSubscription.findUnique({
      where: { userId: session.user.id },
    });
    if (!sub) {
      return NextResponse.json({ error: "No membership subscription found." }, { status: 400 });
    }

    const current = sub.level;
    const action = body.action;
    if (action === "downgrade" || isMembershipLevelDowngrade(current, targetRaw)) {
      if (!isMembershipLevelDowngrade(current, targetRaw)) {
        return NextResponse.json({ error: "Use upgrade for a higher plan." }, { status: 400 });
      }
      const result = await scheduleMembershipDowngrade(session.user.id, targetRaw);
      const effectiveDateLabel = formatMembershipBillingDate(result.effectiveAt);
      const successMessage = buildDowngradeModalContent({
        currentLevel: current as MembershipLevelKey,
        targetLevel: targetRaw,
        effectiveDateLabel,
      }).successMessage;
      return NextResponse.json({ success: true, successMessage, ...result });
    }

    if (action === "upgrade" || isMembershipLevelUpgrade(current, targetRaw)) {
      if (!isMembershipLevelUpgrade(current, targetRaw)) {
        return NextResponse.json({ error: "Use downgrade for a lower plan." }, { status: 400 });
      }
      await upgradeMembershipLevel(session.user.id, targetRaw);
      const successMessage = buildUpgradeModalContent({
        targetLevel: targetRaw,
        amountDueTodayDisplay: "",
        nextBillingLabel: "",
      }).successMessage;
      return NextResponse.json({ success: true, immediate: true, successMessage });
    }

    return NextResponse.json({ error: "You are already on this plan." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === "ALL_ACCESS_CAP_FULL") {
      return NextResponse.json({ error: "All-Access is full right now.", code: "ALL_ACCESS_CAP_FULL" }, { status: 409 });
    }
    if (message.includes("still on")) {
      return NextResponse.json({ error: message, code: "UPGRADE_PAYMENT_FAILED" }, { status: 402 });
    }
    console.error("[change-level]", message);
    return NextResponse.json({ error: message || "Unable to change plan." }, { status: 500 });
  }
}
