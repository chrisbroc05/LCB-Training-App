import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasDatabaseTierAccess, type DatabaseTier } from "@/lib/membership";
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

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membershipTier = (session.user.membershipTier ?? "BASIC") as DatabaseTier;
    if (!hasDatabaseTierAccess(membershipTier, "pro")) {
      return NextResponse.json(
        { error: "Mental game support submissions require a Pro or Elite membership." },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const playerName = String(formData.get("playerName") ?? "").trim();
    const playerAge = String(formData.get("playerAge") ?? "").trim();
    const topic = String(formData.get("topic") ?? "").trim().toUpperCase() as TopicValue;
    const message = String(formData.get("message") ?? "").trim();
    const responsePreference = String(formData.get("responsePreference") ?? "")
      .trim()
      .toUpperCase() as ResponsePreferenceValue;
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

    let videoPath: string | null = null;
    if (uploadedVideo instanceof File && uploadedVideo.size > 0) {
      if (uploadedVideo.size > MAX_VIDEO_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: "Uploaded video is too large. Please upload a file under 100MB." },
          { status: 413 },
        );
      }

      const fileBuffer = Buffer.from(await uploadedVideo.arrayBuffer());
      videoPath = await withTimeout(
        uploadVideoToVimeo({
          fileBuffer,
          fileName: uploadedVideo.name || "mental-game-submission.mp4",
        }),
        VIMEO_TIMEOUT_MS,
        "Vimeo upload",
      );
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
  } catch {
    return NextResponse.json({ error: "Unable to submit mental game support right now." }, { status: 500 });
  }
}
