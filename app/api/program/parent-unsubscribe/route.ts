import { NextResponse } from "next/server";
import { verifyParentUnsubscribeToken } from "@/lib/program-parent-token";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token?.trim();

  if (!token) {
    return NextResponse.json({ error: "Invalid token." }, { status: 400 });
  }

  const enrollmentId = verifyParentUnsubscribeToken(token);
  if (!enrollmentId) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 400 });
  }

  const enrollment = await prisma.programEnrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, parentEmail: true },
  });

  if (!enrollment) {
    return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
  }

  await prisma.programEnrollment.update({
    where: { id: enrollmentId },
    data: { parentEmailsEnabled: false },
  });

  return NextResponse.json({ success: true });
}
