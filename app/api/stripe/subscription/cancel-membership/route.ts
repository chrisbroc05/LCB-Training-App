import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildCancelModalContent } from "@/lib/membership-change-shared";
import { formatMembershipBillingDate } from "@/lib/format-date";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import { cancelMembershipAtPeriodEnd } from "@/lib/stripe-membership-change-server";
import { sendSubscriptionCancellationEmail } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sub = await prisma.membershipSubscription.findUnique({
      where: { userId: session.user.id },
    });
    if (!sub) {
      return NextResponse.json({ error: "No membership subscription found." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, subscriptionCurrentPeriodEnd: true },
    });

    await cancelMembershipAtPeriodEnd(session.user.id);

    const updated = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionCurrentPeriodEnd: true },
    });

    const effectiveEndDate = updated?.subscriptionCurrentPeriodEnd ?? user?.subscriptionCurrentPeriodEnd;
    if (user?.email && effectiveEndDate) {
      try {
        await sendSubscriptionCancellationEmail({
          toEmail: user.email,
          displayName: user.name ?? user.email,
          effectiveEndDate,
        });
      } catch (emailError) {
        console.error("Failed to send membership cancellation email", emailError);
      }
    }

    const accessEndsLabel = formatMembershipBillingDate(
      effectiveEndDate ?? sub.currentPeriodEnd,
    );
    const successMessage = buildCancelModalContent({
      currentLevel: sub.level as MembershipLevelKey,
      accessEndsLabel,
    }).successMessage;

    return NextResponse.json({
      success: true,
      currentPeriodEnd: effectiveEndDate?.toISOString() ?? null,
      successMessage,
    });
  } catch (error) {
    console.error("[cancel-membership]", error);
    return NextResponse.json({ error: "Unable to cancel subscription." }, { status: 500 });
  }
}
