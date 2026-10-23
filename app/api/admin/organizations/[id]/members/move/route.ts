import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { listAdminOrganizations, moveOrganizationMembers } from "@/lib/admin-organizations-server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { userIds?: string[]; orgTeamId?: string | null };
  const userIds = Array.isArray(body.userIds) ? body.userIds : [];
  const result = await moveOrganizationMembers({
    organizationId: id,
    userIds,
    orgTeamId: body.orgTeamId ?? null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const organizations = await listAdminOrganizations();
  return NextResponse.json({ success: true, organizations });
}
