import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { bulkAddOrgTeams, listAdminOrganizations } from "@/lib/admin-organizations-server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  let body: { text?: string };
  try {
    body = (await request.json()) as { text?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = await bulkAddOrgTeams(id, body.text ?? "");
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const organizations = await listAdminOrganizations();
  return NextResponse.json({
    success: true,
    added: result.added,
    reactivated: result.reactivated,
    skipped: result.skipped,
    summary: result.summary,
    organizations,
  });
}
