import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { DatabaseTier } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { sendMentalGameSubmissionNotification } from "@/lib/notifications";
import { uploadVideoToVimeo } from "@/lib/vimeo";

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
const MAX_VIDEO_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB
const VIMEO_TIMEOUT_MS = 120000;
const vimeoUploadEnabled = process.env.VIMEO_UPLOAD_ENABLED?.toLowerCase() === "true";

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
    console.log(`[mental-submit:${requestId}] Session validated for ${session.user.email}`);

    const membershipTier = (session.user.membershipTier ?? "FREE") as DatabaseTier;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { freeSubmissionUsed: true },
    });

    if (membershipTier === "BASIC") {
      console.warn(`[mental-submit:${requestId}] Access denied for tier ${membershipTier}`);
      return NextResponse.json(
        { error: "Mental game submissions require Free (one-time), Pro, or Elite membership." },
        { status: 403 },
      );
    }

    if (membershipTier === "FREE" && user?.freeSubmissionUsed) {
      return NextResponse.json(
        { error: "Your one free submission has already been used. Please upgrade to continue." },
        { status: 403 },
      );
    }

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
      if (!vimeoUploadEnabled) {
        console.warn(
          `[mental-submit:${requestId}] Uploaded file ignored because VIMEO_UPLOAD_ENABLED is false`,
        );
      } else {
      if (uploadedVideo.size > MAX_VIDEO_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: "Uploaded video is too large. Please upload a file under 100MB." },
          { status: 413 },
        );
      }

      const fileBuffer = Buffer.from(await uploadedVideo.arrayBuffer());
      console.log(`[mental-submit:${requestId}] Uploading video to Vimeo`);
      videoPath = await withTimeout(
        uploadVideoToVimeo({
          fileBuffer,
          fileName: uploadedVideo.name || "mental-game-submission.mp4",
        }),
        VIMEO_TIMEOUT_MS,
        "Vimeo upload",
      );
      console.log(`[mental-submit:${requestId}] Vimeo upload complete (${videoPath})`);
      }
    }

    const submission = await prisma.mentalGameSubmission.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        playerName,
        playerAge,
        topic,
        message,
        videoPath,
        responsePreference,
        status: "PENDING",
      },
    });

    if (membershipTier === "FREE") {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { freeSubmissionUsed: true },
      });
    }

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
      });
    } catch (error) {
      console.error("Failed to send mental game submission notification", error);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(`[mental-submit:${requestId}] Submission failed`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isVimeoError =
      errorMessage.includes("VIMEO_ACCESS_TOKEN") ||
      errorMessage.toLowerCase().includes("vimeo");

    if (isVimeoError) {
      return NextResponse.json(
        {
          error:
            "Video upload failed while contacting Vimeo. Please verify Vimeo API credentials/permissions, or submit without a video.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { error: "Unable to submit mental game support right now. Please try again shortly." },
      { status: 500 },
    );
  }
}
