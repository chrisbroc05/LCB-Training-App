import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import {
  createPresignedAdminResponseVideoUploadUrl,
  isAllowedSubmissionVideoContentType,
} from "@/lib/r2";
import {
  ADMIN_RESPONSE_VIDEO_TOO_LARGE_MESSAGE,
  MAX_ADMIN_RESPONSE_VIDEO_BYTES,
} from "@/lib/submission-video-limits";

type ResponseUploadUrlRequestBody = {
  submissionId?: string;
  filename?: string;
  contentType?: string;
  fileSize?: number;
};

function parseRequestBody(body: unknown): ResponseUploadUrlRequestBody | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  return {
    submissionId: typeof record.submissionId === "string" ? record.submissionId : undefined,
    filename: typeof record.filename === "string" ? record.filename : undefined,
    contentType: typeof record.contentType === "string" ? record.contentType : undefined,
    fileSize: typeof record.fileSize === "number" ? record.fileSize : undefined,
  };
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: ResponseUploadUrlRequestBody | null = null;
  try {
    body = parseRequestBody(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const submissionId = body?.submissionId?.trim() ?? "";
  const filename = body?.filename?.trim() ?? "";
  const contentType = body?.contentType?.trim() ?? "";
  const fileSize = body?.fileSize;

  if (!submissionId) {
    return NextResponse.json({ error: "submissionId is required." }, { status: 400 });
  }

  if (!filename || filename.length > 255) {
    return NextResponse.json({ error: "A valid video file name is required." }, { status: 400 });
  }

  if (!contentType || !isAllowedSubmissionVideoContentType(contentType)) {
    return NextResponse.json({ error: "Only video files can be uploaded." }, { status: 400 });
  }

  if (typeof fileSize !== "number" || !Number.isFinite(fileSize) || fileSize <= 0) {
    return NextResponse.json({ error: "A valid video file size is required." }, { status: 400 });
  }

  if (fileSize > MAX_ADMIN_RESPONSE_VIDEO_BYTES) {
    return NextResponse.json({ error: ADMIN_RESPONSE_VIDEO_TOO_LARGE_MESSAGE }, { status: 413 });
  }

  const [swingSubmission, mentalSubmission] = await Promise.all([
    prisma.swingAnalysisSubmission.findUnique({
      where: { id: submissionId },
      select: { id: true },
    }),
    prisma.mentalGameSubmission.findUnique({
      where: { id: submissionId },
      select: { id: true },
    }),
  ]);

  if (!swingSubmission && !mentalSubmission) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }

  try {
    const presignedUpload = await createPresignedAdminResponseVideoUploadUrl({
      submissionId,
      fileName: filename,
      contentType,
      fileSize,
    });

    return NextResponse.json(presignedUpload);
  } catch (error) {
    console.error("[admin-response-upload-url] Failed to create presigned upload URL", error);
    return NextResponse.json(
      { error: "Unable to prepare video upload right now. Please try again." },
      { status: 500 },
    );
  }
}
