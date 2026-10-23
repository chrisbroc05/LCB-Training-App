import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { joinOrganizationForUser } from "@/lib/org-server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to join an organization." }, { status: 401 });
  }

  const body = (await request.json()) as { code?: string; orgTeamId?: string | null };
  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json({ error: "Organization code is required." }, { status: 400 });
  }

  const result = await joinOrganizationForUser({
    userId: session.user.id,
    codeRaw: code,
    orgTeamId: body.orgTeamId ?? null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    organization: { id: result.organization.id, name: result.organization.name },
  });
}
