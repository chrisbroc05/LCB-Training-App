import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { sendSubmissionResponseEmail } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { uploadVideoToVimeo } from "@/lib/vimeo";

type RouteContext = {
  params: Promise<{
    type: string;
    id: string;
  }>;
};

function isVimeoUploadEnabled() {
  return process.env.VIMEO_UPLOAD_ENABLED?.toLowerCase() === "true";
}

function isValidVimeoUrl(value: string) {
  return /^https?:\/\/(www\.)?vimeo\.com\/\d+/i.test(value.trim());
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = await context.params;
  if (params.type !== "swing" && params.type !== "mental") {
    return NextResponse.json({ error: "Invalid submission type" }, { status: 400 });
  }

  const formData = await request.formData();
  const responseMode = String(formData.get("responseMode") ?? "")
    .trim()
    .toLowerCase();
  const writtenResponse = String(formData.get("writtenResponse") ?? "").trim();
  const responseVideo = formData.get("responseVideo");
  const responseVideoUrl = String(formData.get("responseVideoUrl") ?? "").trim();
  const vimeoUploadEnabled = isVimeoUploadEnabled();

  if (responseMode !== "written" && responseMode !== "video") {
    return NextResponse.json({ error: "Invalid response mode." }, { status: 400 });
  }

  if (responseMode === "written" && !writtenResponse) {
    return NextResponse.json({ error: "Written response is required." }, { status: 400 });
  }

  if (responseMode === "video" && vimeoUploadEnabled && !(responseVideo instanceof File) && !responseVideo) {
    return NextResponse.json({ error: "Video response file is required." }, { status: 400 });
  }

  if (responseMode === "video" && !vimeoUploadEnabled && !isValidVimeoUrl(responseVideoUrl)) {
    return NextResponse.json(
      { error: "Please provide a valid Vimeo video link." },
      { status: 400 },
    );
  }

  let videoResponseUrl: string | undefined;
  if (responseMode === "video") {
    if (vimeoUploadEnabled) {
      if (!(responseVideo instanceof File) || responseVideo.size === 0) {
        return NextResponse.json({ error: "Video response file is required." }, { status: 400 });
      }

      const videoBuffer = Buffer.from(await responseVideo.arrayBuffer());
      videoResponseUrl = await uploadVideoToVimeo({
        fileBuffer: videoBuffer,
        fileName: responseVideo.name || "coach-response.mp4",
      });
    } else {
      videoResponseUrl = responseVideoUrl;
    }
  }

  if (params.type === "mental") {
    const existing = await prisma.mentalGameSubmission.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    const updated = await prisma.mentalGameSubmission.update({
      where: { id: params.id },
      data: {
        status: "COMPLETED",
        responseText: responseMode === "written" ? writtenResponse : null,
        responseVideoUrl: responseMode === "video" ? videoResponseUrl : null,
        respondedAt: new Date(),
      },
    });

    await sendSubmissionResponseEmail({
      toEmail: updated.userEmail,
      playerName: updated.playerName,
      submissionType: "MENTAL_GAME",
      responseMode: responseMode === "video" ? "VIDEO" : "WRITTEN",
      writtenResponse: responseMode === "written" ? writtenResponse : undefined,
      videoResponseUrl: responseMode === "video" ? videoResponseUrl : undefined,
    });

    return NextResponse.json({ success: true });
  }

  const existing = await prisma.swingAnalysisSubmission.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }

  const updated = await prisma.swingAnalysisSubmission.update({
    where: { id: params.id },
    data: {
      status: "COMPLETED",
      responseText: responseMode === "written" ? writtenResponse : null,
      responseVideoUrl: responseMode === "video" ? videoResponseUrl : null,
      respondedAt: new Date(),
    },
  });

  await sendSubmissionResponseEmail({
    toEmail: updated.userEmail,
    playerName: updated.playerName,
    submissionType: "SWING_ANALYSIS",
    responseMode: responseMode === "video" ? "VIDEO" : "WRITTEN",
    writtenResponse: responseMode === "written" ? writtenResponse : undefined,
    videoResponseUrl: responseMode === "video" ? videoResponseUrl : undefined,
  });

  return NextResponse.json({ success: true });
}
