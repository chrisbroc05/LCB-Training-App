import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasDatabaseTierAccess, type DatabaseTier } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { sendSwingSubmissionNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const membershipTier = (session.user.membershipTier ?? "BASIC") as DatabaseTier;
    if (!hasDatabaseTierAccess(membershipTier, "pro")) {
      return NextResponse.json(
        { error: "Swing analysis submissions require a Pro or Elite membership." },
        { status: 403 },
      );
    }

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
      const uploadDirectory = path.join(process.cwd(), "public", "uploads", "swing-analysis");
      await mkdir(uploadDirectory, { recursive: true });
      const extension = path.extname(uploadedVideo.name || "") || ".mp4";
      const generatedName = `${Date.now()}-${randomUUID()}${extension}`;
      const absolutePath = path.join(uploadDirectory, generatedName);
      const fileBuffer = Buffer.from(await uploadedVideo.arrayBuffer());
      await writeFile(absolutePath, fileBuffer);
      submittedVideo = `/uploads/swing-analysis/${generatedName}`;
    }

    if (!playerName || !pitchType || !handedness || !notes || !submittedVideo) {
      return NextResponse.json(
        { error: "Player name, form details, and a video are required." },
        { status: 400 },
      );
    }

    if (!["VIDEO_RESPONSE", "WRITTEN_RESPONSE"].includes(responsePreference)) {
      return NextResponse.json({ error: "Invalid response preference selected." }, { status: 400 });
    }

    await prisma.swingAnalysisSubmission.create({
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
    });

    await sendSwingSubmissionNotification({
      userEmail: session.user.email,
      membershipTier,
      playerName,
      pitchType,
      handedness,
      notes,
      responsePreference: responsePreference as "VIDEO_RESPONSE" | "WRITTEN_RESPONSE",
      submittedVideo,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to submit swing analysis right now." }, { status: 500 });
  }
}
