import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import {
  getSubmissionVideoUrl,
  isValidVideoId,
  readSubmissionVideoFile,
  verifyVideoToken,
} from "@/lib/submission-videos";

type RouteContext = {
  params: Promise<{
    videoId: string;
  }>;
};

async function hasUserVideoAccess(userId: string, videoUrl: string) {
  const [swingCount, mentalCount] = await Promise.all([
    prisma.swingAnalysisSubmission.count({
      where: { userId, submittedVideo: videoUrl },
    }),
    prisma.mentalGameSubmission.count({
      where: { userId, videoPath: videoUrl },
    }),
  ]);

  return swingCount > 0 || mentalCount > 0;
}

export async function GET(request: Request, context: RouteContext) {
  const { videoId } = await context.params;
  if (!isValidVideoId(videoId)) {
    return NextResponse.json({ error: "Invalid video id." }, { status: 400 });
  }

  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token") ?? "";
  const expires = Number(requestUrl.searchParams.get("expires") ?? "");
  const tokenIsValid = verifyVideoToken(videoId, expires, token);

  if (!tokenIsValid) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminEmail(session.user.email)) {
      const hasAccess = await hasUserVideoAccess(session.user.id, getSubmissionVideoUrl(videoId));
      if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  try {
    const { fileBuffer, mimeType } = await readSubmissionVideoFile(videoId);
    const asDownload = requestUrl.searchParams.get("download") === "1";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": fileBuffer.byteLength.toString(),
        "Cache-Control": "private, max-age=0, no-store",
        "Content-Disposition": `${asDownload ? "attachment" : "inline"}; filename="${videoId}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }
}
