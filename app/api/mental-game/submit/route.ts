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
import { sendMentalGameSubmissionNotification, sendSubmissionReceivedEmail } from "@/lib/notifications";
import {
  createTemporaryVideoDownloadLink,
  EMAIL_VIDEO_ATTACHMENT_MAX_BYTES,
  MAX_SUBMISSION_VIDEO_BYTES,
  persistSubmissionVideoFile,
} from "@/lib/submission-videos";

type TopicValue =
  | "SLUMP"
  | "CONFIDENCE"
  | "NERVES"
  | "FEAR_OF_FAILURE"
  | "PRESSURE_SITUATIONS"
  | "LOSING_MOTIVATION"
  | "OTHER";

type ResponsePreferenceValue = "VIDEO_RESPONSE" | "WRITTEN_RESPONSE";

const validTopics: TopicValue[] = [
  "SLUMP",
  "CONFIDENCE",
  "NERVES",
  "FEAR_OF_FAILURE",
  "PRESSURE_SITUATIONS",
  "LOSING_MOTIVATION",
  "OTHER",
];

const validResponsePreferences: ResponsePreferenceValue[] = ["VIDEO_RESPONSE", "WRITTEN_RESPONSE"];
const STORAGE_TIMEOUT_MS = 15000;

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
  try {
    console.log(`[mental-submit:${requestId}] Request received`);
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      console.warn(`[mental-submit:${requestId}] Unauthorized request`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const userEmail = session.user.email;
    console.log(`[mental-submit:${requestId}] Session validated for ${userEmail}`);

    console.log(`[mental-submit:${requestId}] Parsing multipart form data`);
    const formData = await request.formData();
    const playerName = String(formData.get("playerName") ?? "").trim();
    const playerAge = String(formData.get("playerAge") ?? "").trim();
    const topic = String(formData.get("topic") ?? "").trim().toUpperCase() as TopicValue;
    const message = String(formData.get("message") ?? "").trim();
    const responsePreference = String(formData.get("responsePreference") ?? "")
      .trim()
      .toUpperCase() as ResponsePreferenceValue;
    const videoUrl = String(formData.get("videoUrl") ?? "").trim();
    const uploadedVideo = formData.get("video");
    let emailAttachment:
      | {
          fileName: string;
          content: Buffer;
          contentType: string;
        }
      | undefined;
    let temporaryDownloadLink: string | undefined;
    let temporaryDownloadExpiresAt: Date | undefined;

    if (!playerName || !playerAge || !message) {
      return NextResponse.json(
        { error: "Player name, age, and detailed message are required." },
        { status: 400 },
      );
    }

    if (!validTopics.includes(topic)) {
      return NextResponse.json({ error: "Invalid topic selected." }, { status: 400 });
    }

    if (!validResponsePreferences.includes(responsePreference)) {
      return NextResponse.json({ error: "Invalid response preference selected." }, { status: 400 });
    }

    let videoPath: string | null = videoUrl || null;
    if (uploadedVideo instanceof File && uploadedVideo.size > 0) {
      console.log(
        `[mental-submit:${requestId}] Uploaded file detected (${uploadedVideo.name}, ${uploadedVideo.size} bytes)`,
      );
      if (uploadedVideo.size > MAX_SUBMISSION_VIDEO_BYTES) {
        return NextResponse.json(
          { error: "Uploaded video is too large. Please upload a file under 100MB." },
          { status: 413 },
        );
      }

      const storedVideo = await withTimeout(
        persistSubmissionVideoFile(uploadedVideo),
        STORAGE_TIMEOUT_MS,
        "Video file storage",
      );
      videoPath = storedVideo.relativeUrl;
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
    }

    const transactionResult = await prisma.$transaction(async (tx) => {
      const consumed = await consumeCoachingSubmission(tx, userId);
      if (!consumed.ok) {
        return {
          ok: false as const,
          membershipTier: consumed.membershipTier,
          lockReason: consumed.availability.lockReason,
        };
      }

      const submission = await tx.mentalGameSubmission.create({
        data: {
          userId,
          userEmail,
          playerName,
          playerAge,
          topic,
          message,
          videoPath,
          responsePreference,
          status: "PENDING",
        },
      });

      return {
        ok: true as const,
        submission,
        membershipTier: consumed.membershipTier,
      };
    });

    if (!transactionResult.ok) {
      return NextResponse.json(
        {
          error: getCoachingSubmissionLimitError(
            transactionResult.membershipTier,
            transactionResult.lockReason ?? "monthly-limit",
          ),
        },
        { status: 403 },
      );
    }

    const submission = transactionResult.submission;
    const membershipTier = transactionResult.membershipTier;

    try {
      await sendMentalGameSubmissionNotification({
        userEmail: submission.userEmail,
        membershipTier,
        playerName: submission.playerName,
        playerAge: submission.playerAge,
        topic: submission.topic,
        message: submission.message,
        videoPath: submission.videoPath,
        responsePreference: submission.responsePreference,
        status: submission.status,
        videoAttachment: emailAttachment,
        temporaryVideoLink: temporaryDownloadLink,
        temporaryVideoLinkExpiresAt: temporaryDownloadExpiresAt,
      });
    } catch (error) {
      console.error("Failed to send mental game submission notification", error);
    }

    try {
      const firstName =
        session.user.name?.trim().split(/\s+/)[0] ?? playerName.trim().split(/\s+/)[0] ?? "there";
      await sendSubmissionReceivedEmail({
        toEmail: submission.userEmail,
        firstName,
      });
    } catch (error) {
      console.error("Failed to send mental game user confirmation email", error);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(`[mental-submit:${requestId}] Submission failed`, error);
    return NextResponse.json(
      { error: "Unable to submit mental game support right now. Please try again shortly." },
      { status: 500 },
    );
  }
}
