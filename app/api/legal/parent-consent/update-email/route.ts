import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateParentConsentEmailForUser } from "@/lib/legal-server";

type UpdateEmailBody = {
  parentConsentEmail?: string;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as UpdateEmailBody;
  const parentConsentEmail = body.parentConsentEmail?.trim() ?? "";

  const result = await updateParentConsentEmailForUser(session.user.id, parentConsentEmail);
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        parentConsentEmail: "parentConsentEmail" in result ? result.parentConsentEmail : undefined,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    parentConsentEmail: result.parentConsentEmail,
    resendsRemaining: result.resendsRemaining,
  });
}
