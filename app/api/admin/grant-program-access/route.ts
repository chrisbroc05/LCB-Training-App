import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { applyAdminProductAccess } from "@/lib/admin-product-access-server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const adminEmail = session?.user?.email;
  if (!isAdminEmail(adminEmail)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    stripePaidOn?: string;
  } | null;
  const email = body?.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, membershipTier: true },
  });

  if (!user) {
    return NextResponse.json({ error: "No user found with that email." }, { status: 404 });
  }

  const result = await applyAdminProductAccess({
    userId: user.id,
    product: "twelve_week_program",
    action: "grant",
    adminEmail: adminEmail!,
    stripePaidOn: body?.stripePaidOn,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const enrollment = await prisma.programEnrollment.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  return NextResponse.json({
    success: true,
    message: result.message,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      membershipTier: "TWELVE_WEEK",
    },
    enrollmentId: enrollment?.id ?? null,
  });
}
