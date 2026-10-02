import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resendParentConsentEmailForUser } from "@/lib/legal-server";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await resendParentConsentEmailForUser(session.user.id);
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        resendsRemaining: "resendsRemaining" in result ? result.resendsRemaining : undefined,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    resendsRemaining: result.resendsRemaining,
  });
}
