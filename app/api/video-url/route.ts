import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  createPresignedR2VideoPlaybackUrl,
  isValidR2ObjectKey,
  parseR2VideoReference,
  R2_VIDEO_PREFIX,
} from "@/lib/r2";
import { userCanAccessR2VideoKey } from "@/lib/r2-video-access";

type VideoUrlRequestBody = {
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
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: VideoUrlRequestBody;
  try {
    body = (await request.json()) as VideoUrlRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const r2Key = normalizeR2Key(body.r2Key ?? "");
  if (!r2Key || !isValidR2ObjectKey(r2Key)) {
    return NextResponse.json({ error: "Invalid video key." }, { status: 400 });
  }

  const isAdmin = isAdminEmail(session.user.email);
  if (!isAdmin) {
    const hasAccess = await userCanAccessR2VideoKey(session.user.id, r2Key);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const playback = await createPresignedR2VideoPlaybackUrl(r2Key);
    return NextResponse.json(playback);
  } catch (error) {
    console.error("[video-url] Failed to create presigned playback URL", error);
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }
}
