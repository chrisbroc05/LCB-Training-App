import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { serializeProgramEnrollment } from "@/lib/program-enrollment";
import { validateSecondEmail } from "@/lib/second-email-shared";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });

  const enrollment = await prisma.programEnrollment.findUnique({
    where: { userId: session.user.id },
  });

  if (!enrollment) {
    return NextResponse.json({ error: "Program enrollment not found." }, { status: 404 });
  }

  return NextResponse.json({
    enrollment: serializeProgramEnrollment(enrollment),
    accountEmail: user?.email ?? session.user.email,
  });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membershipTier: true, email: true },
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

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data: {
    dailyRoutineEmailsEnabled?: boolean;
    parentName?: string | null;
    parentEmail?: string | null;
    parentEmailsEnabled?: boolean;
    parentPromptDismissedAt?: Date;
  } = {};

  if ("dailyRoutineEmailsEnabled" in body) {
    if (typeof body.dailyRoutineEmailsEnabled !== "boolean") {
      return NextResponse.json({ error: "Invalid daily email setting." }, { status: 400 });
    }
    data.dailyRoutineEmailsEnabled = body.dailyRoutineEmailsEnabled;
  }

  if ("parentEmailsEnabled" in body) {
    if (typeof body.parentEmailsEnabled !== "boolean") {
      return NextResponse.json({ error: "Invalid second email setting." }, { status: 400 });
    }
    data.parentEmailsEnabled = body.parentEmailsEnabled;
  }

  if ("parentName" in body) {
    if (body.parentName === null || body.parentName === "") {
      data.parentName = null;
    } else if (typeof body.parentName === "string") {
      const trimmed = body.parentName.trim();
      data.parentName = trimmed || null;
    } else {
      return NextResponse.json({ error: "Invalid name." }, { status: 400 });
    }
  }

  if ("parentEmail" in body) {
    if (body.parentEmail === null || body.parentEmail === "") {
      data.parentEmail = null;
    } else if (typeof body.parentEmail === "string") {
      const validated = validateSecondEmail({
        secondEmail: body.parentEmail,
        accountEmail: user.email,
      });
      if (!validated.ok) {
        return NextResponse.json({ error: validated.error }, { status: 400 });
      }
      data.parentEmail = validated.email;
    } else {
      return NextResponse.json({ error: "Invalid second email." }, { status: 400 });
    }
  }

  if (body.dismissParentPrompt === true) {
    data.parentPromptDismissedAt = new Date();
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 });
  }

  const updated = await prisma.programEnrollment.update({
    where: { userId: session.user.id },
    data,
  });

  return NextResponse.json({ enrollment: serializeProgramEnrollment(updated) });
}
