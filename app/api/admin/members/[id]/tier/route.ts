import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdminEmail } from "@/lib/admin";
import {
  adminMemberDetailSelect,
  buildManualTierUpdateData,
  parseAdminMembershipTier,
  serializeAdminMemberDetail,
} from "@/lib/admin-members";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UpdateTierBody = {
  membershipTier?: string;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  let body: UpdateTierBody;
  try {
    body = (await request.json()) as UpdateTierBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const membershipTier = parseAdminMembershipTier(body.membershipTier);
  if (!membershipTier) {
    return NextResponse.json({ error: "A valid membershipTier is required." }, { status: 400 });
  }

  const existingMember = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingMember) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const updatedMember = await prisma.user.update({
    where: { id },
    data: buildManualTierUpdateData(membershipTier),
    select: adminMemberDetailSelect,
  });

  return NextResponse.json({
    success: true,
    member: serializeAdminMemberDetail(updatedMember),
  });
}
