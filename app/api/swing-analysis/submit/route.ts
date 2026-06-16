import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasDatabaseTierAccess, type DatabaseTier } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { sendSwingSubmissionNotification } from "@/lib/notifications";

const MAX_VIDEO_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB
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
    if (!session?.user?.email) {
      console.warn(`[swing-submit:${requestId}] Unauthorized request`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(`[swing-submit:${requestId}] Session validated for ${session.user.email}`);

    const membershipTier = (session.user.membershipTier ?? "BASIC") as DatabaseTier;
    if (!hasDatabaseTierAccess(membershipTier, "pro")) {
      console.warn(
        `[swing-submit:${requestId}] Access denied for tier ${membershipTier} (${session.user.email})`,
      );
      return NextResponse.json(
        { error: "Swing analysis submissions require a Pro or Elite membership." },
        { status: 403 },
      );
    }

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

    if (uploadedVideo instanceof File && uploadedVideo.size > 0) {
      console.log(
        `[swing-submit:${requestId}] Uploaded file detected (${uploadedVideo.name}, ${uploadedVideo.size} bytes)`,
      );
      if (uploadedVideo.size > MAX_VIDEO_UPLOAD_BYTES) {
        console.warn(
          `[swing-submit:${requestId}] File too large (${uploadedVideo.size} > ${MAX_VIDEO_UPLOAD_BYTES})`,
        );
        return NextResponse.json(
          { error: "Uploaded video is too large. Please upload a file under 100MB." },
          { status: 413 },
        );
      }

      const uploadDirectory = path.join(process.cwd(), "public", "uploads", "swing-analysis");
      await mkdir(uploadDirectory, { recursive: true });
      const extension = path.extname(uploadedVideo.name || "") || ".mp4";
      const generatedName = `${Date.now()}-${randomUUID()}${extension}`;
      const absolutePath = path.join(uploadDirectory, generatedName);
      const fileBuffer = Buffer.from(await uploadedVideo.arrayBuffer());
      console.log(
        `[swing-submit:${requestId}] Writing uploaded video to disk (${absolutePath})`,
      );
      await writeFile(absolutePath, fileBuffer);
      submittedVideo = `/uploads/swing-analysis/${generatedName}`;
      console.log(`[swing-submit:${requestId}] File persisted as ${submittedVideo}`);
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
    await withTimeout(
      prisma.swingAnalysisSubmission.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        playerName,
        pitchType,
        handedness,
        notes,
        submittedVideo,
        responsePreference: responsePreference as "VIDEO_RESPONSE" | "WRITTEN_RESPONSE",
        status: "PENDING",
      },
    }),
      DB_TIMEOUT_MS,
      "Database insert",
    );
    console.log(`[swing-submit:${requestId}] Submission saved to database`);

    console.log(
      `[swing-submit:${requestId}] Sending submission notification (no Vimeo upload in this step)`,
    );
    try {
      await withTimeout(
        sendSwingSubmissionNotification({
          userEmail: session.user.email,
          membershipTier,
          playerName,
          pitchType,
          handedness,
          notes,
          responsePreference: responsePreference as "VIDEO_RESPONSE" | "WRITTEN_RESPONSE",
          submittedVideo,
        }),
        EMAIL_TIMEOUT_MS,
        "Notification email",
      );
      console.log(`[swing-submit:${requestId}] Notification email sent`);
    } catch (emailError) {
      console.error(`[swing-submit:${requestId}] Notification failed`, emailError);
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
