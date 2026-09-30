import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { jsonNoStore } from "@/lib/api-no-store";
import { prisma } from "@/lib/prisma";
import {
  createPresignedCoachVideoUploadUrl,
  isAllowedSubmissionVideoContentType,
} from "@/lib/r2";
import {
  ADMIN_RESPONSE_VIDEO_TOO_LARGE_MESSAGE,
  MAX_ADMIN_RESPONSE_VIDEO_BYTES,
} from "@/lib/submission-video-limits";

export { dynamic, revalidate } from "@/lib/api-no-store";

type UploadUrlRequestBody = {
  userId?: string;
  filename?: string;
  contentType?: string;
  fileSize?: number;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return jsonNoStore({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as UploadUrlRequestBody | null;
  const userId = body?.userId?.trim() ?? "";
  const filename = body?.filename?.trim() ?? "";
  const contentType = body?.contentType?.trim() ?? "";
  const fileSize = body?.fileSize;

  if (!userId) {
    return jsonNoStore({ error: "userId is required." }, { status: 400 });
  }

  if (!filename || filename.length > 255) {
    return jsonNoStore({ error: "A valid video file name is required." }, { status: 400 });
  }

  if (!contentType || !isAllowedSubmissionVideoContentType(contentType)) {
    return jsonNoStore({ error: "Only video files can be uploaded." }, { status: 400 });
  }

  if (typeof fileSize !== "number" || !Number.isFinite(fileSize) || fileSize <= 0) {
    return jsonNoStore({ error: "A valid video file size is required." }, { status: 400 });
  }

  if (fileSize > MAX_ADMIN_RESPONSE_VIDEO_BYTES) {
    return jsonNoStore({ error: ADMIN_RESPONSE_VIDEO_TOO_LARGE_MESSAGE }, { status: 413 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    return jsonNoStore({ error: "Player not found." }, { status: 404 });
  }

  try {
    const presignedUpload = await createPresignedCoachVideoUploadUrl({
      userId,
      fileName: filename,
      contentType,
      fileSize,
    });

    return jsonNoStore(presignedUpload);
  } catch (error) {
    console.error("[admin-coach-video-upload-url] Failed to create presigned upload URL", error);
    return jsonNoStore(
      { error: "Unable to prepare video upload right now. Please try again." },
      { status: 500 },
    );
  }
}
