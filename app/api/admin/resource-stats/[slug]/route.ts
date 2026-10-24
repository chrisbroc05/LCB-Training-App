import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { loadAdminResourceClickRows } from "@/lib/admin-resource-stats-server";
import { parseAdminResourceStatsRange } from "@/lib/admin-resource-stats-shared";
import { getResourceDefinition } from "@/lib/resources-shared";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { slug } = await context.params;
  if (!getResourceDefinition(slug)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const range = parseAdminResourceStatsRange(searchParams.get("range"));
  const rows = await loadAdminResourceClickRows(slug, range);
  return NextResponse.json({ rows, range, slug });
}
