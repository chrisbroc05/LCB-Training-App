import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseMembershipBillingInterval } from "@/lib/membership-billing-shared";
import { previewMembershipBillingIntervalSwitch } from "@/lib/stripe-membership-preview-server";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const interval = parseMembershipBillingInterval(searchParams.get("interval") ?? undefined);
    const preview = await previewMembershipBillingIntervalSwitch({
      userId: session.user.id,
      targetInterval: interval,
    });

    return NextResponse.json(preview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to preview billing change.";
    console.error("[billing-interval-preview]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
