import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  createPresignedR2ImageUrl,
  isValidR2ObjectKey,
  parseR2VideoReference,
  R2_VIDEO_PREFIX,
} from "@/lib/r2";
import { adminCanAccessR2VideoKey, userCanAccessR2VideoKey } from "@/lib/r2-video-access";

type Body = {
  posterR2Key?: string;
  videoR2Key?: string;
};

function normalizeKey(value: string) {
  const trimmed = value.trim();
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

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const posterR2Key = normalizeKey(body.posterR2Key ?? "");
  const videoR2Key = normalizeKey(body.videoR2Key ?? "");
  if (!posterR2Key || !videoR2Key || !isValidR2ObjectKey(posterR2Key)) {
    return NextResponse.json({ error: "Invalid image key." }, { status: 400 });
  }

  const isAdmin = isAdminEmail(session.user.email);
  const hasAccess = isAdmin
    ? await adminCanAccessR2VideoKey(videoR2Key)
    : await userCanAccessR2VideoKey(session.user.id, videoR2Key);

  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const image = await createPresignedR2ImageUrl(posterR2Key);
    return NextResponse.json(image);
  } catch (error) {
    console.error("[r2-image-url]", error);
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }
}
