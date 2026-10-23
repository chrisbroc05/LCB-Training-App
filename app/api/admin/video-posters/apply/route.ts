import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  applyVideoPosterBackfillRecord,
  type VideoPosterBackfillItem,
} from "@/lib/video-poster-backfill-server";
import { validateVideoPosterR2Key } from "@/lib/video-poster-server";

type Body = {
  targetType?: VideoPosterBackfillItem["targetType"];
  id?: string;
  videoR2Key?: string;
  posterR2Key?: string;
};

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

  const targetType = body.targetType;
  const id = body.id?.trim() ?? "";
  const videoR2Key = body.videoR2Key?.trim() ?? "";
  const posterR2Key = body.posterR2Key?.trim() ?? "";

  if (!targetType || !id || !videoR2Key || !posterR2Key) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const validationError = await validateVideoPosterR2Key(videoR2Key, posterR2Key);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    await applyVideoPosterBackfillRecord({ targetType, id, posterR2Key });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin-video-posters-apply]", error);
    return NextResponse.json({ error: "Unable to save poster." }, { status: 500 });
  }
}
