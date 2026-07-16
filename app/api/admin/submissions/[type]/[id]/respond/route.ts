import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { sendSubmissionResponseEmail } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import {
  getCloudinaryAttachmentDownloadUrl,
  uploadVideoToCloudinary,
} from "@/lib/cloudinary";
import { isValidVimeoUrl } from "@/lib/vimeo";

const MAX_VIDEO_UPLOAD_BYTES = 100 * 1024 * 1024; // 100MB
const EMAIL_VIDEO_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024; // 10MB

type RouteContext = {
  params: Promise<{
    type: string;
    id: string;
  }>;
};

function isCloudinaryAdminUploadEnabled() {
  return process.env.CLOUDINARY_ADMIN_RESPONSE_UPLOAD_ENABLED?.toLowerCase() === "true";
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
  const videoInputMode = String(formData.get("videoInputMode") ?? "upload")
    .trim()
    .toLowerCase();
  const cloudinaryAdminUploadEnabled = isCloudinaryAdminUploadEnabled();

  if (responseMode !== "written" && responseMode !== "video") {
    return NextResponse.json({ error: "Invalid response mode." }, { status: 400 });
  }

  if (responseMode === "written" && !writtenResponse) {
    return NextResponse.json({ error: "Written response is required." }, { status: 400 });
  }

  if (responseMode === "video" && videoInputMode !== "upload" && videoInputMode !== "vimeo") {
    return NextResponse.json({ error: "Invalid video input mode." }, { status: 400 });
  }

  let videoResponseUrl: string | undefined;
  let videoResponseAttachment:
    | {
        fileName: string;
        content: Buffer;
        contentType: string;
      }
    | undefined;
  let videoResponseDownloadLink: string | undefined;

  if (responseMode === "video") {
    if (videoInputMode === "upload") {
      if (!cloudinaryAdminUploadEnabled) {
        return NextResponse.json(
          { error: "Device upload is currently disabled. Please use a Vimeo response link." },
          { status: 400 },
        );
      }

      if (!(responseVideo instanceof File) || responseVideo.size === 0) {
        return NextResponse.json({ error: "Video response file is required." }, { status: 400 });
      }

      if (responseVideo.size > MAX_VIDEO_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: "Uploaded response video must be under 100MB." },
          { status: 413 },
        );
      }

      const videoBuffer = Buffer.from(await responseVideo.arrayBuffer());
      let cloudinaryUpload;
      try {
        cloudinaryUpload = await uploadVideoToCloudinary({
          fileBuffer: videoBuffer,
          fileName: responseVideo.name || "coach-response.mp4",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown Cloudinary upload error";
        return NextResponse.json(
          { error: `Unable to upload coach response video: ${message}` },
          { status: 502 },
        );
      }
      videoResponseUrl = cloudinaryUpload.secureUrl;

      if (videoBuffer.byteLength <= EMAIL_VIDEO_ATTACHMENT_MAX_BYTES) {
        videoResponseAttachment = {
          fileName: responseVideo.name || "coach-response.mp4",
          content: videoBuffer,
          contentType: responseVideo.type || "video/mp4",
        };
      } else {
        videoResponseDownloadLink = getCloudinaryAttachmentDownloadUrl({
          publicId: cloudinaryUpload.publicId,
          format: cloudinaryUpload.format,
        });
      }
    } else {
      if (!isValidVimeoUrl(responseVideoUrl)) {
        return NextResponse.json(
          { error: "Please provide a valid Vimeo video link." },
          { status: 400 },
        );
      }
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

    const user = await prisma.user.findUnique({
      where: { id: updated.userId },
      select: { membershipTier: true },
    });

    await sendSubmissionResponseEmail({
      toEmail: updated.userEmail,
      playerName: updated.playerName,
      submissionType: "MENTAL_GAME",
      responseMode: responseMode === "video" ? "VIDEO" : "WRITTEN",
      membershipTier: user?.membershipTier,
      writtenResponse: responseMode === "written" ? writtenResponse : undefined,
      videoResponseUrl: responseMode === "video" ? videoResponseUrl : undefined,
      videoAttachment: responseMode === "video" ? videoResponseAttachment : undefined,
      videoDownloadLink: responseMode === "video" ? videoResponseDownloadLink : undefined,
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

  const user = await prisma.user.findUnique({
    where: { id: updated.userId },
    select: { membershipTier: true },
  });

  await sendSubmissionResponseEmail({
    toEmail: updated.userEmail,
    playerName: updated.playerName,
    submissionType: "SWING_ANALYSIS",
    responseMode: responseMode === "video" ? "VIDEO" : "WRITTEN",
    membershipTier: user?.membershipTier,
    writtenResponse: responseMode === "written" ? writtenResponse : undefined,
    videoResponseUrl: responseMode === "video" ? videoResponseUrl : undefined,
    videoAttachment: responseMode === "video" ? videoResponseAttachment : undefined,
    videoDownloadLink: responseMode === "video" ? videoResponseDownloadLink : undefined,
  });

  return NextResponse.json({ success: true });
}
