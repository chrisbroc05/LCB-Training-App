import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createPresignedSubmissionVideoUploadUrl,
  isAllowedSubmissionVideoContentType,
} from "@/lib/r2";
import {
  MAX_SUBMISSION_VIDEO_BYTES,
  SUBMISSION_VIDEO_TOO_LARGE_MESSAGE,
} from "@/lib/submission-videos";

type UploadUrlRequestBody = {
  fileName?: string;
  contentType?: string;
  fileSize?: number;
};

function parseUploadUrlRequestBody(body: unknown): UploadUrlRequestBody | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  return {
    fileName: typeof record.fileName === "string" ? record.fileName : undefined,
    contentType: typeof record.contentType === "string" ? record.contentType : undefined,
    fileSize: typeof record.fileSize === "number" ? record.fileSize : undefined,
  };
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: UploadUrlRequestBody | null = null;
  try {
    body = parseUploadUrlRequestBody(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fileName = body?.fileName?.trim() ?? "";
  const contentType = body?.contentType?.trim() ?? "";
  const fileSize = body?.fileSize;

  if (!fileName || fileName.length > 255) {
    return NextResponse.json({ error: "A valid video file name is required." }, { status: 400 });
  }

  if (!contentType || !isAllowedSubmissionVideoContentType(contentType)) {
    return NextResponse.json({ error: "Only video files can be uploaded." }, { status: 400 });
  }

  if (typeof fileSize !== "number" || !Number.isFinite(fileSize) || fileSize <= 0) {
    return NextResponse.json({ error: "A valid video file size is required." }, { status: 400 });
  }

  if (fileSize > MAX_SUBMISSION_VIDEO_BYTES) {
    return NextResponse.json({ error: SUBMISSION_VIDEO_TOO_LARGE_MESSAGE }, { status: 413 });
  }

  try {
    const presignedUpload = await createPresignedSubmissionVideoUploadUrl({
      userId: session.user.id,
      fileName,
      contentType,
      fileSize,
    });

    return NextResponse.json(presignedUpload);
  } catch (error) {
    console.error("[swing-upload-url] Failed to create presigned upload URL", error);
    return NextResponse.json(
      { error: "Unable to prepare video upload right now. Please try again." },
      { status: 500 },
    );
  }
}
