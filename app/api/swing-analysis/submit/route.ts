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
import { sendSubmissionReceivedEmail, sendSwingSubmissionNotification } from "@/lib/notifications";
import {
  createTemporaryVideoDownloadLink,
  EMAIL_VIDEO_ATTACHMENT_MAX_BYTES,
  MAX_SUBMISSION_VIDEO_BYTES,
  persistSubmissionVideoFile,
} from "@/lib/submission-videos";

const DB_TIMEOUT_MS = 15000;
const EMAIL_TIMEOUT_MS = 15000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
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

    console.log(`[swing-submit:${requestId}] Parsing multipart form data`);
    const formData = await request.formData();
    const playerName = String(formData.get("playerName") ?? "").trim();
    const pitchType = String(formData.get("pitchType") ?? "").trim();
    const handedness = String(formData.get("handedness") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();
    const responsePreference = String(formData.get("responsePreference") ?? "")
      .trim()
      .toUpperCase();
    const videoUrl = String(formData.get("videoUrl") ?? "").trim();
    const uploadedVideo = formData.get("video");
    let submittedVideo = videoUrl;
    let emailAttachment:
      | {
          fileName: string;
          content: Buffer;
          contentType: string;
        }
      | undefined;
    let temporaryDownloadLink: string | undefined;
    let temporaryDownloadExpiresAt: Date | undefined;

    if (uploadedVideo instanceof File && uploadedVideo.size > 0) {
      console.log(
        `[swing-submit:${requestId}] Uploaded file detected (${uploadedVideo.name}, ${uploadedVideo.size} bytes)`,
      );
      if (uploadedVideo.size > MAX_SUBMISSION_VIDEO_BYTES) {
        console.warn(
          `[swing-submit:${requestId}] File too large (${uploadedVideo.size} > ${MAX_SUBMISSION_VIDEO_BYTES})`,
        );
        return NextResponse.json(
          { error: "Uploaded video is too large. Please upload a file under 100MB." },
          { status: 413 },
        );
      }

      const storedVideo = await withTimeout(
        persistSubmissionVideoFile(uploadedVideo),
        EMAIL_TIMEOUT_MS,
        "Video file storage",
      );

      submittedVideo = storedVideo.relativeUrl;
      if (storedVideo.sizeBytes <= EMAIL_VIDEO_ATTACHMENT_MAX_BYTES) {
        emailAttachment = {
          fileName: storedVideo.originalFileName,
          content: storedVideo.fileBuffer,
          contentType: storedVideo.mimeType,
        };
      } else {
        const tempLink = createTemporaryVideoDownloadLink(storedVideo.videoId);
        temporaryDownloadLink = tempLink.url;
        temporaryDownloadExpiresAt = tempLink.expiresAt;
      }
    } else {
      console.log(`[swing-submit:${requestId}] No uploaded file, using provided video URL`);
    }

    if (!playerName || !pitchType || !handedness || !notes || !submittedVideo) {
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
            pitchType,
            handedness,
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

    console.log(
      `[swing-submit:${requestId}] Sending submission notification`,
    );
    try {
      await withTimeout(
        sendSwingSubmissionNotification({
          userEmail,
          membershipTier,
          playerName,
          pitchType,
          handedness,
          notes,
          responsePreference: responsePreference as "VIDEO_RESPONSE" | "WRITTEN_RESPONSE",
          submittedVideo,
          videoAttachment: emailAttachment,
          temporaryVideoLink: temporaryDownloadLink,
          temporaryVideoLinkExpiresAt: temporaryDownloadExpiresAt,
        }),
        EMAIL_TIMEOUT_MS,
        "Notification email",
      );
      console.log(`[swing-submit:${requestId}] Notification email sent`);
    } catch (emailError) {
      console.error(`[swing-submit:${requestId}] Notification failed`, emailError);
    }

    try {
      const firstName =
        session.user.name?.trim().split(/\s+/)[0] ?? playerName.trim().split(/\s+/)[0] ?? "there";
      await withTimeout(
        sendSubmissionReceivedEmail({
          toEmail: userEmail,
          firstName,
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
