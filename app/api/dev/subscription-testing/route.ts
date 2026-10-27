import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  expireMembershipGraceNow,
  simulateMembershipRenewalPaymentFailed,
} from "@/lib/dev-subscription-testing-server";

type Body = {
  action?: "simulate_payment_failed" | "expire_grace";
  userId?: string;
};

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const body = (await request.json()) as Body;
  const userId = body.userId?.trim() || session.user.id;

  try {
    if (body.action === "simulate_payment_failed") {
      const result = await simulateMembershipRenewalPaymentFailed(userId);
      return NextResponse.json(result);
    }
    if (body.action === "expire_grace") {
      await expireMembershipGraceNow(userId);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
