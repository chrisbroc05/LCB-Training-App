import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isMembershipLevelKey } from "@/lib/membership-levels-shared";
import { previewMembershipPlanChange } from "@/lib/stripe-membership-preview-server";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const actionRaw = searchParams.get("action")?.toLowerCase();
    const action =
      actionRaw === "upgrade" || actionRaw === "downgrade" || actionRaw === "cancel"
        ? actionRaw
        : null;
    if (!action) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    const levelRaw = searchParams.get("level")?.trim().toUpperCase() ?? "";
    const targetLevel = isMembershipLevelKey(levelRaw) ? levelRaw : undefined;

    if (action !== "cancel" && !targetLevel) {
      return NextResponse.json({ error: "Choose a plan level." }, { status: 400 });
    }

    const preview = await previewMembershipPlanChange({
      userId: session.user.id,
      action,
      targetLevel,
    });

    return NextResponse.json(preview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to preview plan change.";
    console.error("[plan-change-preview]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
