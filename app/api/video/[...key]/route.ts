import { Readable } from "stream";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import {
  formatR2VideoReference,
  getR2ObjectStream,
  isValidR2ObjectKey,
} from "@/lib/r2";

type RouteContext = {
  params: Promise<{
    key: string[];
  }>;
};

async function userCanAccessR2Video(userId: string, reference: string) {
  const [swingSubmitted, swingResponse, mentalSubmitted, mentalResponse] = await Promise.all([
    prisma.swingAnalysisSubmission.count({
      where: { userId, submittedVideo: reference },
    }),
    prisma.swingAnalysisSubmission.count({
      where: { userId, responseVideoUrl: reference },
    }),
    prisma.mentalGameSubmission.count({
      where: { userId, videoPath: reference },
    }),
    prisma.mentalGameSubmission.count({
      where: { userId, responseVideoUrl: reference },
    }),
  ]);

  return swingSubmitted + swingResponse + mentalSubmitted + mentalResponse > 0;
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key: keySegments } = await context.params;
  const key = keySegments.map((segment) => decodeURIComponent(segment)).join("/");

  if (!isValidR2ObjectKey(key)) {
    return NextResponse.json({ error: "Invalid video key." }, { status: 400 });
  }

  const reference = formatR2VideoReference(key);
  const isAdmin = isAdminEmail(session.user.email);
  if (!isAdmin) {
    const hasAccess = await userCanAccessR2Video(session.user.id, reference);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const { body, contentType, contentLength } = await getR2ObjectStream(key);
    const webStream = Readable.toWeb(body as Readable);

    return new NextResponse(webStream as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        ...(contentLength ? { "Content-Length": contentLength.toString() } : {}),
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": `inline; filename="${key.split("/").pop() ?? "video.mp4"}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }
}
