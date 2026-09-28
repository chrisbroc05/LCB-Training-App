import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { ProgramEmailType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { runProgramEmailScheduler, sendTestProgramEmail } from "@/lib/program-email-scheduler";
import { sendPushToUser } from "@/lib/push-send";
import { prisma } from "@/lib/prisma";

const EMAIL_TYPES: ProgramEmailType[] = [
  "DAILY_ROUTINE",
  "DAY_BEFORE_START",
  "SATURDAY_VIDEO_REMINDER",
  "GONE_QUIET",
  "PARENT_SATURDAY_VIDEO",
  "PARENT_GONE_QUIET",
  "PARENT_WEEKLY_RECAP",
  "COACH_DAILY_SUMMARY",
];

function isProgramEmailType(value: unknown): value is ProgramEmailType {
  return typeof value === "string" && EMAIL_TYPES.includes(value as ProgramEmailType);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await runProgramEmailScheduler({ dryRun: true });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    action?: string;
    type?: string;
    enrollmentId?: string;
    toEmail?: string;
  } | null;

  if (body?.action === "dryRun") {
    const result = await runProgramEmailScheduler({ dryRun: true });
    return NextResponse.json(result);
  }

  if (body?.action === "sendTestPush") {
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await sendPushToUser(
      userId,
      {
        title: "LCB Training admin test",
        body: "Push notifications are working.",
        url: "/admin/program",
      },
      {
        type: "TEST",
        dedupeKey: `${userId}:TEST:admin:${Date.now()}`,
        skipLog: true,
        skipDedupeCheck: true,
      },
    );

    if (result.sent === 0) {
      return NextResponse.json(
        { error: result.reason ?? "No push subscriptions found for your account." },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  }

  if (body?.action !== "sendTest") {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  if (!isProgramEmailType(body.type)) {
    return NextResponse.json({ error: "Invalid email type." }, { status: 400 });
  }

  if (typeof body.enrollmentId !== "string" || !body.enrollmentId.trim()) {
    return NextResponse.json({ error: "Enrollment is required." }, { status: 400 });
  }

  if (typeof body.toEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.toEmail.trim())) {
    return NextResponse.json({ error: "Valid test email is required." }, { status: 400 });
  }

  const enrollment = await prisma.programEnrollment.findUnique({
    where: { id: body.enrollmentId },
    select: { id: true },
  });

  if (!enrollment) {
    return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
  }

  try {
    const subject = await sendTestProgramEmail({
      type: body.type,
      enrollmentId: body.enrollmentId,
      toEmail: body.toEmail.trim(),
    });

    return NextResponse.json({ success: true, subject });
  } catch (error) {
    console.error("Failed to send test program email", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to send test email." },
      { status: 500 },
    );
  }
}
