import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdminEmail } from "@/lib/admin";
import {
  adminMemberListSelect,
  serializeAdminMemberSummary,
} from "@/lib/admin-members";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = await prisma.user.findMany({
    select: adminMemberListSelect,
    orderBy: { signupDate: "desc" },
  });

  return NextResponse.json({
    members: members.map(serializeAdminMemberSummary),
  });
}
