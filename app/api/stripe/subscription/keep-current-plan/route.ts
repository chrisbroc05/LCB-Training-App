import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  buildKeepCurrentPlanSuccessMessage,
  buildResumeMembershipSuccessMessage,
} from "@/lib/membership-change-shared";
import { prisma } from "@/lib/prisma";
import {
  releaseScheduledMembershipDowngrade,
  resumeMembershipAfterScheduledCancel,
} from "@/lib/stripe-membership-change-server";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";

type Body = {
  intent?: "pending_downgrade" | "scheduled_cancel";
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Body;
    const sub = await prisma.membershipSubscription.findUnique({
      where: { userId: session.user.id },
    });
    if (!sub) {
      return NextResponse.json({ error: "No membership subscription found." }, { status: 400 });
    }

    const currentLevel = sub.level as MembershipLevelKey;

    if (body.intent === "scheduled_cancel") {
      await resumeMembershipAfterScheduledCancel(session.user.id);
      return NextResponse.json({
        success: true,
        successMessage: buildResumeMembershipSuccessMessage(currentLevel),
      });
    }

    if (body.intent === "pending_downgrade") {
      await releaseScheduledMembershipDowngrade(session.user.id);
      return NextResponse.json({
        success: true,
        successMessage: buildKeepCurrentPlanSuccessMessage(currentLevel),
      });
    }

    return NextResponse.json({ error: "Invalid intent." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update plan.";
    console.error("[keep-current-plan]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
