import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdminEmail } from "@/lib/admin";
import { loadAdminCommissionOrgExport } from "@/lib/admin-commissions-server";
import { buildCommissionCsv } from "@/lib/commission-export-shared";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const orgId = url.searchParams.get("orgId")?.trim();
  const monthKey = url.searchParams.get("monthKey")?.trim();
  if (!orgId || !monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
    return NextResponse.json({ error: "orgId and monthKey are required." }, { status: 400 });
  }

  const data = await loadAdminCommissionOrgExport(orgId, monthKey);
  if (!data) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  const csv = buildCommissionCsv({
    orgName: data.org.name,
    monthKey: data.monthKey,
    rows: data.rows,
    monthCommissionCents: data.monthCommissionCents,
    refundCommissionCents: data.refundCommissionCents,
    carriedBalanceCents: data.carriedBalanceCents,
  });

  const filename = `commission-${data.org.name.replaceAll(/[^a-zA-Z0-9-_]+/g, "-")}-${monthKey}.csv`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
