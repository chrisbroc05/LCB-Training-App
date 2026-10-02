import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { DatabaseTier } from "@/lib/membership";
import {
  consumeCoachingSubmission,
  getCoachingSubmissionLimitError,
} from "@/lib/coaching-submissions";
import { prisma } from "@/lib/prisma";
import { sendCoachNewSubmissionPush } from "@/lib/coach-push-instant";
import { getCoachSubmissionEmailContext } from "@/lib/submission-coach-context";
import { sendSubmissionReceivedEmail, sendSwingSubmissionNotification } from "@/lib/notifications";
import {
  formatR2VideoReference,
  headR2Object,
  isUserSubmissionVideoKey,
} from "@/lib/r2";
import { requireUnder13ParentUnlockResponse } from "@/lib/legal-under13-guard-server";
import {
  validateSubmissionLookAt,
  validateSubmissionNote,
  validateSubmissionVideoCategory,
  validateSubmissionWhere,
} from "@/lib/submission-form-shared";

const DB_TIMEOUT_MS = 15000;
const EMAIL_TIMEOUT_MS = 15000;

type SwingSubmitRequestBody = {
  playerName?: string;
  handedness?: string;
  whereWasThis?: string;
  videoCategory?: string;
  lookAtFocus?: string;
  notes?: string;
  responsePreference?: string;
  videoUrl?: string;
  r2Key?: string;
};

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

function parseSubmitRequestBody(body: unknown): SwingSubmitRequestBody | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  return {
    playerName: typeof record.playerName === "string" ? record.playerName : undefined,
    handedness: typeof record.handedness === "string" ? record.handedness : undefined,
    whereWasThis: typeof record.whereWasThis === "string" ? record.whereWasThis : undefined,
    videoCategory: typeof record.videoCategory === "string" ? record.videoCategory : undefined,
    lookAtFocus: typeof record.lookAtFocus === "string" ? record.lookAtFocus : undefined,
    notes: typeof record.notes === "string" ? record.notes : undefined,
    responsePreference:
      typeof record.responsePreference === "string" ? record.responsePreference : undefined,
    videoUrl: typeof record.videoUrl === "string" ? record.videoUrl : undefined,
    r2Key: typeof record.r2Key === "string" ? record.r2Key : undefined,
  };
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  const startTime = Date.now();

  try {
    console.log(`[swing-submit:${requestId}] Request received`);
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      console.warn(`[swing-submit:${requestId}] Unauthorized request`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const userEmail = session.user.email;
    console.log(`[swing-submit:${requestId}] Session validated for ${userEmail}`);

    const under13LockError = await requireUnder13ParentUnlockResponse(userId);
    if (under13LockError) {
      return under13LockError;
    }

    let body: SwingSubmitRequestBody | null = null;
    try {
      body = parseSubmitRequestBody(await request.json());
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const playerName = body?.playerName?.trim() ?? "";
    const handedness = body?.handedness?.trim() ?? "";
    const responsePreference = body?.responsePreference?.trim().toUpperCase() ?? "";
    const videoUrl = body?.videoUrl?.trim() ?? "";
    const r2Key = body?.r2Key?.trim() ?? "";

    const whereValidation = validateSubmissionWhere(body?.whereWasThis ?? "");
    if (!whereValidation.ok) {
      return NextResponse.json({ error: whereValidation.error }, { status: 400 });
    }

    const categoryValidation = validateSubmissionVideoCategory(body?.videoCategory ?? "");
    if (!categoryValidation.ok) {
      return NextResponse.json({ error: categoryValidation.error }, { status: 400 });
    }

    const lookAtValidation = validateSubmissionLookAt(
      body?.lookAtFocus ?? "",
      categoryValidation.value,
    );
    if (!lookAtValidation.ok) {
      return NextResponse.json({ error: lookAtValidation.error }, { status: 400 });
    }

    const noteValidation = validateSubmissionNote(body?.notes ?? "");
    if (!noteValidation.ok) {
      return NextResponse.json({ error: noteValidation.error }, { status: 400 });
    }

    const notes = noteValidation.note;

    let submittedVideo = videoUrl;

    if (r2Key) {
      if (!isUserSubmissionVideoKey(r2Key, userId)) {
        console.warn(`[swing-submit:${requestId}] Invalid R2 key for user (${r2Key})`);
        return NextResponse.json({ error: "Invalid uploaded video reference." }, { status: 400 });
      }

      try {
        await headR2Object(r2Key);
      } catch {
        console.warn(`[swing-submit:${requestId}] Uploaded video not found in R2 (${r2Key})`);
        return NextResponse.json(
          { error: "Uploaded video was not found. Please upload your video again." },
          { status: 400 },
        );
      }

      submittedVideo = formatR2VideoReference(r2Key);
      console.log(`[swing-submit:${requestId}] Using presigned R2 upload (${r2Key})`);
    } else if (videoUrl) {
      console.log(`[swing-submit:${requestId}] Using provided video URL`);
    }

    if (!playerName || !handedness || !submittedVideo) {
      console.warn(`[swing-submit:${requestId}] Validation failed for required fields`);
      return NextResponse.json(
        { error: "Player name, form details, and a video are required." },
        { status: 400 },
      );
    }

    if (!["VIDEO_RESPONSE", "WRITTEN_RESPONSE"].includes(responsePreference)) {
      console.warn(`[swing-submit:${requestId}] Invalid response preference: ${responsePreference}`);
      return NextResponse.json({ error: "Invalid response preference selected." }, { status: 400 });
    }

    console.log(`[swing-submit:${requestId}] Creating swing submission record`);
    const transactionResult = await withTimeout(
      prisma.$transaction(async (tx) => {
        const consumed = await consumeCoachingSubmission(tx, userId);
        if (!consumed.ok) {
          return {
            ok: false as const,
            membershipTier: consumed.membershipTier,
            lockReason: consumed.availability.lockReason,
          };
        }

        const createdSubmission = await tx.swingAnalysisSubmission.create({
          data: {
            userId,
            userEmail,
            playerName,
            pitchType: "",
            handedness,
            whereWasThis: whereValidation.value,
            lookAtFocus: lookAtValidation.value,
            videoCategory: categoryValidation.value,
            notes,
            submittedVideo,
            responsePreference: responsePreference as "VIDEO_RESPONSE" | "WRITTEN_RESPONSE",
            status: "PENDING",
          },
        });

        return {
          ok: true as const,
          createdSubmission,
          membershipTier: consumed.membershipTier,
        };
      }),
      DB_TIMEOUT_MS,
      "Database insert",
    );

    if (!transactionResult.ok) {
      const membershipTier = transactionResult.membershipTier as DatabaseTier;
      return NextResponse.json(
        {
          error: getCoachingSubmissionLimitError(
            membershipTier,
            transactionResult.lockReason ?? "monthly-limit",
          ),
        },
        { status: 403 },
      );
    }

    const createdSubmission = transactionResult.createdSubmission;
    const membershipTier = transactionResult.membershipTier;
    console.log(
      `[swing-submit:${requestId}] Submission saved to database (id=${createdSubmission.id}, submittedVideo=${createdSubmission.submittedVideo})`,
    );
    if (!createdSubmission.submittedVideo?.trim()) {
      console.warn(
        `[swing-submit:${requestId}] Submission stored with empty submittedVideo for id=${createdSubmission.id}`,
      );
    }

    const firstName =
      session.user.name?.trim().split(/\s+/)[0] ?? playerName.trim().split(/\s+/)[0] ?? "";
    const coachEmailContext = await getCoachSubmissionEmailContext(userId, membershipTier);

    console.log(
      `[swing-submit:${requestId}] Sending submission notification`,
    );
    try {
      await withTimeout(
        sendSwingSubmissionNotification({
          submissionId: createdSubmission.id,
          firstName,
          fullName: playerName,
          membershipTier,
          whereWasThis: whereValidation.value,
          lookAtFocus: lookAtValidation.value,
          videoCategory: categoryValidation.value,
          note: notes,
          submittedAt: createdSubmission.createdAt,
          ...coachEmailContext,
        }),
        EMAIL_TIMEOUT_MS,
        "Notification email",
      );
      console.log(`[swing-submit:${requestId}] Notification email sent`);
    } catch (emailError) {
      console.error(`[swing-submit:${requestId}] Notification failed`, emailError);
    }

    void sendCoachNewSubmissionPush({
      submissionId: createdSubmission.id,
      submissionTab: "swing",
      playerName,
    });

    try {
      await withTimeout(
        sendSubmissionReceivedEmail({
          toEmail: userEmail,
          firstName,
          submissionType: "SWING",
          playerNotes: notes,
          membershipTier,
          submittedAt: createdSubmission.createdAt,
        }),
        EMAIL_TIMEOUT_MS,
        "User confirmation email",
      );
      console.log(`[swing-submit:${requestId}] User confirmation email sent`);
    } catch (confirmationEmailError) {
      console.error(
        `[swing-submit:${requestId}] User confirmation email failed`,
        confirmationEmailError,
      );
    }

    console.log(
      `[swing-submit:${requestId}] Completed successfully in ${Date.now() - startTime}ms`,
    );
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(`[swing-submit:${requestId}] Submission failed`, error);
    return NextResponse.json(
      { error: "Unable to submit swing analysis right now. Please try again in a moment." },
      { status: 500 },
    );
  }
}
