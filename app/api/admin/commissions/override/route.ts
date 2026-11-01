import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdminEmail } from "@/lib/admin";
import {
  loadAdminCommissionOrgSummary,
  updateMemberCommissionOverride,
} from "@/lib/admin-commissions-server";
import { authOptions } from "@/lib/auth";

type OverrideBody = {
  userId?: string;
  organizationId?: string;
  countForCommission?: boolean;
  note?: string | null;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: OverrideBody;
  try {
    body = (await request.json()) as OverrideBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const userId = body.userId?.trim();
  const organizationId = body.organizationId?.trim();
  if (!userId || !organizationId) {
    return NextResponse.json({ error: "User and organization are required." }, { status: 400 });
  }
  if (typeof body.countForCommission !== "boolean") {
    return NextResponse.json({ error: "countForCommission is required." }, { status: 400 });
  }

  await updateMemberCommissionOverride({
    userId,
    countForCommission: body.countForCommission,
    note: body.note?.trim() || null,
  });

  const summary = await loadAdminCommissionOrgSummary(organizationId);
  return NextResponse.json({ summary });
}
