import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { ProgramEmailType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  sendTestCoachNewProgramPlayerPush,
  sendTestCoachNewSubmissionPush,
  sendTestCoachNightlySummaryPush,
} from "@/lib/coach-push-scheduler";
import { buildCoachDailySummaryData } from "@/lib/program-email-data";
import { getChicagoDateTimeParts } from "@/lib/program-email-chicago";
import { isMarketingEmailType } from "@/lib/marketing-email-shared";
import {
  runMarketingEmailScheduler,
  sendTestMarketingEmail,
} from "@/lib/marketing-email-scheduler";
import { runProgramEmailScheduler, sendTestProgramEmail } from "@/lib/program-email-scheduler";
import {
  sendTestCoachNewMessagePush,
  sendTestCoachReplyEmail,
  sendTestCoachReplyPush,
} from "@/lib/direct-messaging-notifications";
import { getPlayerFirstName } from "@/lib/program-email-templates";
import { sendPushToUser } from "@/lib/push-send";
import { sendTestCoachSubmissionNotificationEmail } from "@/lib/notifications";
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

  const [programResult, marketingResult] = await Promise.all([
    runProgramEmailScheduler({ dryRun: true }),
    runMarketingEmailScheduler({ dryRun: true }),
  ]);

  return NextResponse.json({
    ...programResult,
    marketingPreviews: marketingResult.previews,
    marketingSent: marketingResult.sent,
    marketingSkipped: marketingResult.skipped,
    marketingErrors: marketingResult.errors,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    action?: string;
    type?: string;
    coachAlertType?: string;
    coachEmailType?: string;
    enrollmentId?: string;
    toEmail?: string;
    playerName?: string;
    userId?: string;
    messageTestType?: string;
  } | null;

  if (body?.action === "dryRun") {
    const [programResult, marketingResult] = await Promise.all([
      runProgramEmailScheduler({ dryRun: true }),
      runMarketingEmailScheduler({ dryRun: true }),
    ]);

    return NextResponse.json({
      ...programResult,
      marketingPreviews: marketingResult.previews,
      marketingSent: marketingResult.sent,
      marketingSkipped: marketingResult.skipped,
      marketingErrors: marketingResult.errors,
    });
  }

  if (body?.action === "sendTestMarketing") {
    if (typeof body.type !== "string" || !isMarketingEmailType(body.type)) {
      return NextResponse.json({ error: "Invalid marketing email type." }, { status: 400 });
    }

    if (typeof body.toEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.toEmail.trim())) {
      return NextResponse.json({ error: "Valid test email is required." }, { status: 400 });
    }

    try {
      const subject = await sendTestMarketingEmail({
        type: body.type,
        toEmail: body.toEmail.trim(),
        userId:
          typeof body.userId === "string" && body.userId.trim() ? body.userId.trim() : undefined,
      });

      return NextResponse.json({ success: true, subject });
    } catch (error) {
      console.error("Failed to send test marketing email", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unable to send test marketing email." },
        { status: 500 },
      );
    }
  }

  if (body?.action === "sendTestPush") {
    if (typeof body.enrollmentId !== "string" || !body.enrollmentId.trim()) {
      return NextResponse.json({ error: "Pick a player first." }, { status: 400 });
    }

    const enrollment = await prisma.programEnrollment.findUnique({
      where: { id: body.enrollmentId.trim() },
      select: { userId: true },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
    }

    const result = await sendPushToUser(
      enrollment.userId,
      {
        title: "LCB Training admin test",
        body: "Push notifications are working.",
        url: "/dashboard",
      },
      {
        type: "TEST",
        dedupeKey: `${enrollment.userId}:TEST:admin:${Date.now()}`,
        skipLog: true,
        skipDedupeCheck: true,
      },
    );

    if (result.sent === 0) {
      const message =
        result.reason === "no_subscriptions"
          ? "This player has not turned on notifications yet."
          : result.reason === "push_not_configured"
            ? "Push is not configured on the server."
            : "Unable to send test push.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  }

  if (body?.action === "sendTestCoachEmail") {
    if (typeof body.toEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.toEmail.trim())) {
      return NextResponse.json({ error: "Valid test email is required." }, { status: 400 });
    }

    const coachEmailType = body.coachEmailType;
    if (coachEmailType !== "COACH_NEW_SUBMISSION_SWING" && coachEmailType !== "COACH_NEW_SUBMISSION_MENTAL") {
      return NextResponse.json({ error: "Invalid coach email type." }, { status: 400 });
    }

    try {
      const subject = await sendTestCoachSubmissionNotificationEmail({
        submissionTab: coachEmailType === "COACH_NEW_SUBMISSION_SWING" ? "swing" : "mental",
        toEmail: body.toEmail.trim(),
        enrollmentId:
          typeof body.enrollmentId === "string" && body.enrollmentId.trim()
            ? body.enrollmentId.trim()
            : undefined,
      });

      return NextResponse.json({ success: true, subject });
    } catch (error) {
      console.error("Failed to send test coach submission email", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unable to send test coach email." },
        { status: 500 },
      );
    }
  }

  if (body?.action === "sendTestCoachAlert") {
    const playerName =
      typeof body.playerName === "string" && body.playerName.trim()
        ? body.playerName.trim()
        : "Test Player";

    try {
      if (body.coachAlertType === "COACH_NEW_SUBMISSION_SWING") {
        await sendTestCoachNewSubmissionPush({
          submissionTab: "swing",
          submissionId: "test",
          playerName,
        });
      } else if (body.coachAlertType === "COACH_NEW_SUBMISSION_MENTAL") {
        await sendTestCoachNewSubmissionPush({
          submissionTab: "mental",
          submissionId: "test",
          playerName,
        });
      } else if (body.coachAlertType === "COACH_NEW_PROGRAM_PLAYER") {
        if (typeof body.enrollmentId !== "string" || !body.enrollmentId.trim()) {
          return NextResponse.json({ error: "Pick a player first." }, { status: 400 });
        }

        const enrollment = await prisma.programEnrollment.findUnique({
          where: { id: body.enrollmentId.trim() },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        });

        if (!enrollment) {
          return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
        }

        await sendTestCoachNewProgramPlayerPush({
          enrollmentId: enrollment.id,
          playerName: enrollment.user.name ?? playerName,
          playerEmail: enrollment.user.email,
        });
      } else if (body.coachAlertType === "COACH_NEW_MESSAGE") {
        await sendTestCoachNewMessagePush({
          playerFirstName: getPlayerFirstName(playerName, "player@example.com"),
          body: "Hey Coach, quick question about today's hitting work.",
        });
      } else if (body.coachAlertType === "COACH_NIGHTLY_SUMMARY") {
        const { dateKey } = getChicagoDateTimeParts();
        const summaryData = await buildCoachDailySummaryData(dateKey);
        if (!summaryData) {
          return NextResponse.json(
            { error: "No active players for nightly summary." },
            { status: 400 },
          );
        }

        await sendTestCoachNightlySummaryPush({
          dateKey,
          summaryData,
        });
      } else {
        return NextResponse.json({ error: "Invalid coach alert type." }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Failed to send test coach alert", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unable to send test coach alert." },
        { status: 500 },
      );
    }
  }

  if (body?.action === "sendTestMessageNotification") {
    if (typeof body.enrollmentId !== "string" || !body.enrollmentId.trim()) {
      return NextResponse.json({ error: "Pick a player first." }, { status: 400 });
    }

    const enrollment = await prisma.programEnrollment.findUnique({
      where: { id: body.enrollmentId.trim() },
      select: { userId: true },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
    }

    const messageTestType = body.messageTestType;
    const sampleBody = "Great work today. Keep building on that approach.";

    try {
      if (messageTestType === "COACH_REPLY_PUSH") {
        await sendTestCoachReplyPush({
          userId: enrollment.userId,
          body: sampleBody,
        });
        return NextResponse.json({ success: true });
      }

      if (messageTestType === "COACH_REPLY_EMAIL") {
        if (typeof body.toEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.toEmail.trim())) {
          return NextResponse.json({ error: "Valid test email is required." }, { status: 400 });
        }

        const subject = await sendTestCoachReplyEmail({
          toEmail: body.toEmail.trim(),
          body: sampleBody,
        });
        return NextResponse.json({ success: true, subject });
      }

      return NextResponse.json({ error: "Invalid message test type." }, { status: 400 });
    } catch (error) {
      console.error("Failed to send test message notification", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unable to send test message notification." },
        { status: 500 },
      );
    }
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
