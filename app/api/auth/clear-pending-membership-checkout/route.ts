import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { clearMembershipCheckoutIntent } from "@/lib/membership-checkout-intent-server";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await clearMembershipCheckoutIntent(session.user.id);
  return NextResponse.json({ success: true });
}
