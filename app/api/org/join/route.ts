import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ORG_TEAM_NOT_LISTED_VALUE } from "@/lib/org-team-pick-shared";
import { joinOrganizationForUser } from "@/lib/org-server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to join an organization." }, { status: 401 });
  }

  const body = (await request.json()) as {
    code?: string;
    orgTeamId?: string | null;
    notListed?: boolean;
  };
  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json({ error: "Organization code is required." }, { status: 400 });
  }

  const rawTeamId = body.orgTeamId?.trim() || null;
  const notListed =
    body.notListed === true || rawTeamId === ORG_TEAM_NOT_LISTED_VALUE;

  const result = await joinOrganizationForUser({
    userId: session.user.id,
    codeRaw: code,
    orgTeamId: notListed ? null : rawTeamId,
    notListed,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    organization: { id: result.organization.id, name: result.organization.name },
  });
}
