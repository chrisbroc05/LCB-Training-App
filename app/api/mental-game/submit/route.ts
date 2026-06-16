import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasDatabaseTierAccess, type DatabaseTier } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { sendMentalGameSubmissionNotification } from "@/lib/notifications";

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

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
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
      const uploadDirectory = path.join(process.cwd(), "public", "uploads", "mental-game");
      await mkdir(uploadDirectory, { recursive: true });

      const safeOriginalName = sanitizeFilename(uploadedVideo.name || "mental-game-video.mp4");
      const extension = path.extname(safeOriginalName) || ".mp4";
      const generatedName = `${Date.now()}-${randomUUID()}${extension}`;
      const absolutePath = path.join(uploadDirectory, generatedName);
      const fileBuffer = Buffer.from(await uploadedVideo.arrayBuffer());

      await writeFile(absolutePath, fileBuffer);
      videoPath = `/uploads/mental-game/${generatedName}`;
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
