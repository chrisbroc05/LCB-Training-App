import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  createPresignedVideoPosterUploadUrl,
  headR2Object,
  isValidR2ObjectKey,
  parseR2VideoReference,
  R2_VIDEO_PREFIX,
} from "@/lib/r2";

type Body = {
  videoR2Key?: string;
  fileSize?: number;
};

function normalizeVideoKey(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith(R2_VIDEO_PREFIX)) {
    return parseR2VideoReference(trimmed) ?? "";
  }
  return trimmed;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const videoR2Key = normalizeVideoKey(body.videoR2Key ?? "");
  const fileSize = body.fileSize;
  if (
    !videoR2Key ||
    !isValidR2ObjectKey(videoR2Key) ||
    typeof fileSize !== "number" ||
    fileSize <= 0 ||
    fileSize > 2_000_000
  ) {
    return NextResponse.json({ error: "Invalid poster upload request." }, { status: 400 });
  }

  try {
    await headR2Object(videoR2Key);
  } catch {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }

  try {
    const presigned = await createPresignedVideoPosterUploadUrl({
      videoKey: videoR2Key,
      fileSize,
    });
    return NextResponse.json(presigned);
  } catch (error) {
    console.error("[admin-video-poster-upload-url]", error);
    return NextResponse.json({ error: "Unable to prepare poster upload." }, { status: 500 });
  }
}
