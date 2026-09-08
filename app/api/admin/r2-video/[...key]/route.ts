import { Readable } from "stream";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getR2ObjectStream } from "@/lib/r2";

type RouteContext = {
  params: Promise<{
    key: string[];
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key: keySegments } = await context.params;
  const key = keySegments.map((segment) => decodeURIComponent(segment)).join("/");

  if (!key.startsWith("submissions/") || key.includes("..")) {
    return NextResponse.json({ error: "Invalid video key." }, { status: 400 });
  }

  try {
    const { body, contentType, contentLength } = await getR2ObjectStream(key);
    const webStream = Readable.toWeb(body as Readable);

    return new NextResponse(webStream as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        ...(contentLength ? { "Content-Length": contentLength.toString() } : {}),
        "Cache-Control": "private, max-age=0, no-store",
        "Content-Disposition": `inline; filename="${key.split("/").pop() ?? "submission-video.mp4"}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }
}
