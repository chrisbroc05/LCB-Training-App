import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadMembershipPaymentBanner } from "@/lib/membership-payment-banner-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const banner = await loadMembershipPaymentBanner(session.user.id);
  return NextResponse.json(banner, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
