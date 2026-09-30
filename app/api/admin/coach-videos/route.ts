import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { jsonNoStore } from "@/lib/api-no-store";
import { listAdminCoachVideosForUser } from "@/lib/coach-video-server";
import { sendCoachVideoToPlayer } from "@/lib/coach-video-send";

export { dynamic, revalidate } from "@/lib/api-no-store";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return jsonNoStore({ error: "Forbidden" }, { status: 403 });
  }

  const userId = new URL(request.url).searchParams.get("userId")?.trim() ?? "";
  if (!userId) {
    return jsonNoStore({ error: "userId is required." }, { status: 400 });
  }

  const videos = await listAdminCoachVideosForUser(userId);
  return jsonNoStore({ videos });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdminEmail(session.user.email)) {
    return jsonNoStore({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    userId?: string;
    enrollmentId?: string | null;
    title?: string;
    note?: string;
    videoKey?: string;
    videoContentType?: string;
    videoSizeBytes?: number;
    drillCategory?: string | null;
  } | null;

  if (!body?.userId?.trim()) {
    return jsonNoStore({ error: "userId is required." }, { status: 400 });
  }

  if (!body.title?.trim()) {
    return jsonNoStore({ error: "Title is required." }, { status: 400 });
  }

  if (!body.videoKey?.trim()) {
    return jsonNoStore({ error: "videoKey is required." }, { status: 400 });
  }

  if (typeof body.videoSizeBytes !== "number") {
    return jsonNoStore({ error: "videoSizeBytes is required." }, { status: 400 });
  }

  try {
    const coachVideo = await sendCoachVideoToPlayer({
      coachUserId: session.user.id,
      input: {
        userId: body.userId.trim(),
        enrollmentId: body.enrollmentId?.trim() || null,
        title: body.title,
        note: body.note ?? "",
        videoKey: body.videoKey.trim(),
        videoContentType: body.videoContentType?.trim() || "video/mp4",
        videoSizeBytes: body.videoSizeBytes,
        drillCategory: body.drillCategory ?? null,
      },
    });

    return jsonNoStore({
      video: {
        id: coachVideo.id,
        title: coachVideo.title,
        createdAt: coachVideo.createdAt.toISOString(),
        viewedAt: coachVideo.viewedAt?.toISOString() ?? null,
        drillCategory: coachVideo.drillCategory,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send video.";
    return jsonNoStore({ error: message }, { status: 400 });
  }
}
