import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  createPresignedR2VideoDownloadUrl,
  isValidR2ObjectKey,
  parseR2VideoReference,
  R2_VIDEO_PREFIX,
} from "@/lib/r2";

type VideoDownloadUrlRequestBody = {
  r2Key?: string;
};

function normalizeR2Key(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith(R2_VIDEO_PREFIX)) {
    return parseR2VideoReference(trimmed) ?? "";
  }

  return trimmed;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: VideoDownloadUrlRequestBody;
  try {
    body = (await request.json()) as VideoDownloadUrlRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const r2Key = normalizeR2Key(body.r2Key ?? "");
  if (!r2Key || !isValidR2ObjectKey(r2Key)) {
    return NextResponse.json({ error: "Invalid video key." }, { status: 400 });
  }

  try {
    const download = await createPresignedR2VideoDownloadUrl(r2Key);
    return NextResponse.json(download);
  } catch (error) {
    console.error("[admin-video-download-url] Failed to create presigned download URL", error);
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }
}
