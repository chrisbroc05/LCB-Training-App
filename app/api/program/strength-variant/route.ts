import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { serializeProgramEnrollment } from "@/lib/program-enrollment";
import { isStrengthVariant, type StrengthVariant } from "@/lib/strength-variant-shared";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membershipTier: true },
  });

  if (!user || user.membershipTier !== "TWELVE_WEEK") {
    return NextResponse.json({ error: "Program access required." }, { status: 403 });
  }

  const enrollment = await prisma.programEnrollment.findUnique({
    where: { userId: session.user.id },
  });

  if (!enrollment) {
    return NextResponse.json({ error: "Program enrollment not found." }, { status: 404 });
  }

  return NextResponse.json({ enrollment: serializeProgramEnrollment(enrollment) });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membershipTier: true },
  });

  if (!user || user.membershipTier !== "TWELVE_WEEK") {
    return NextResponse.json({ error: "Program access required." }, { status: 403 });
  }

  const existing = await prisma.programEnrollment.findUnique({
    where: { userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Program enrollment not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as { strengthVariant?: string } | null;
  if (!body?.strengthVariant || !isStrengthVariant(body.strengthVariant)) {
    return NextResponse.json({ error: "Invalid workout equipment selection." }, { status: 400 });
  }

  const updated = await prisma.programEnrollment.update({
    where: { userId: session.user.id },
    data: { strengthVariant: body.strengthVariant as StrengthVariant },
  });

  return NextResponse.json({ enrollment: serializeProgramEnrollment(updated) });
}
