import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdminEmail } from "@/lib/admin";
import {
  adminMemberDetailSelect,
  serializeAdminMemberDetail,
} from "@/lib/admin-members";
import {
  applyAdminMembershipLevelGrant,
  parseAdminMembershipLevel,
  parseAdminMembershipLevelExpiresAt,
} from "@/lib/admin-membership-level-server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UpdateBody = {
  membershipLevel?: string | null;
  membershipLevelExpiresAt?: string | null;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  let body: UpdateBody;
  try {
    body = (await request.json()) as UpdateBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!("membershipLevel" in body)) {
    return NextResponse.json({ error: "membershipLevel is required." }, { status: 400 });
  }

  const membershipLevel = parseAdminMembershipLevel(body.membershipLevel);
  if (body.membershipLevel !== null && body.membershipLevel !== "" && !membershipLevel) {
    return NextResponse.json({ error: "Invalid membershipLevel." }, { status: 400 });
  }

  const expiresAt = parseAdminMembershipLevelExpiresAt(body.membershipLevelExpiresAt);
  if (body.membershipLevelExpiresAt !== undefined && body.membershipLevelExpiresAt !== null && expiresAt === null) {
    return NextResponse.json({ error: "Invalid membershipLevelExpiresAt." }, { status: 400 });
  }

  const existingMember = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingMember) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  await applyAdminMembershipLevelGrant({
    userId: id,
    membershipLevel,
    membershipLevelExpiresAt: expiresAt,
  });

  const updatedMember = await prisma.user.findUnique({
    where: { id },
    select: adminMemberDetailSelect,
  });

  if (!updatedMember) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    member: serializeAdminMemberDetail(updatedMember),
  });
}
