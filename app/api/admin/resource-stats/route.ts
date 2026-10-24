import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { loadAdminResourceStatsTable } from "@/lib/admin-resource-stats-server";
import { parseAdminResourceStatsRange } from "@/lib/admin-resource-stats-shared";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const range = parseAdminResourceStatsRange(searchParams.get("range"));
  const rows = await loadAdminResourceStatsTable(range);
  return NextResponse.json({ rows, range });
}
