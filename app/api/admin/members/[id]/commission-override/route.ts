import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdminEmail } from "@/lib/admin";
import { loadAdminMemberDetailSerialized } from "@/lib/admin-member-detail-server";
import { updateMemberCommissionOverride } from "@/lib/admin-commissions-server";
import { authOptions } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type OverrideBody = {
  countForCommission?: boolean;
  note?: string | null;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  let body: OverrideBody;
  try {
    body = (await request.json()) as OverrideBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.countForCommission !== "boolean") {
    return NextResponse.json({ error: "countForCommission is required." }, { status: 400 });
  }

  await updateMemberCommissionOverride({
    userId: id,
    countForCommission: body.countForCommission,
    note: body.note?.trim() || null,
  });

  const member = await loadAdminMemberDetailSerialized(id);
  if (!member) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  return NextResponse.json({ member });
}
