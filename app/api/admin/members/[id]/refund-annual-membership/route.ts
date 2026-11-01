import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdminEmail } from "@/lib/admin";
import { loadAdminMemberDetailSerialized } from "@/lib/admin-member-detail-server";
import { executeAdminAnnualMembershipRefund } from "@/lib/admin-membership-annual-refund-server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  try {
    await executeAdminAnnualMembershipRefund(id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process refund.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const member = await loadAdminMemberDetailSerialized(id);

  if (!member) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  return NextResponse.json({ member });
}
