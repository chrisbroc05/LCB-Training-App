import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdminEmail } from "@/lib/admin";
import { isCommissionPayoutMethod } from "@/lib/admin-commissions-shared";
import {
  loadAdminCommissionOrgSummary,
  markOrgCommissionMonthPaid,
} from "@/lib/admin-commissions-server";
import { authOptions } from "@/lib/auth";

type PayoutBody = {
  organizationId?: string;
  monthKey?: string;
  amountCents?: number;
  paidAt?: string;
  method?: string;
  note?: string | null;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: PayoutBody;
  try {
    body = (await request.json()) as PayoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const organizationId = body.organizationId?.trim();
  const monthKey = body.monthKey?.trim();
  const method = body.method?.trim() ?? "";
  if (!organizationId || !monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
    return NextResponse.json({ error: "Organization and month are required." }, { status: 400 });
  }
  if (!isCommissionPayoutMethod(method)) {
    return NextResponse.json({ error: "Payment method must be check, ACH, or Zelle." }, { status: 400 });
  }

  const summary = await loadAdminCommissionOrgSummary(organizationId);
  if (!summary) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  const monthRow = summary.monthSummaries.find((row) => row.monthKey === monthKey);
  if (!monthRow) {
    return NextResponse.json({ error: "Month not found." }, { status: 400 });
  }

  const amountCents =
    typeof body.amountCents === "number" && body.amountCents > 0
      ? Math.round(body.amountCents)
      : monthRow.amountDueCents;
  if (amountCents <= 0) {
    return NextResponse.json({ error: "Nothing due for this month." }, { status: 400 });
  }

  const paidAt = body.paidAt ? new Date(body.paidAt) : new Date();
  if (Number.isNaN(paidAt.getTime())) {
    return NextResponse.json({ error: "Invalid payment date." }, { status: 400 });
  }

  await markOrgCommissionMonthPaid({
    organizationId,
    monthKey,
    amountCents,
    paidAt,
    method,
    note: body.note?.trim() || null,
  });

  const refreshed = await loadAdminCommissionOrgSummary(organizationId);
  return NextResponse.json({ summary: refreshed });
}
