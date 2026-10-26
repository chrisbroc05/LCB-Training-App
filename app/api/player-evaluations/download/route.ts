import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveEvaluationPdfPresignedDownloadUrl } from "@/lib/evaluation-pdf-download-server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const submissionId = new URL(request.url).searchParams.get("submissionId")?.trim();
  if (!submissionId) {
    return NextResponse.json({ error: "submissionId is required." }, { status: 400 });
  }

  const resolved = await resolveEvaluationPdfPresignedDownloadUrl({
    submissionId,
    userId: session.user.id,
    userEmail: session.user.email,
  });

  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  return NextResponse.json({
    downloadUrl: resolved.downloadUrl,
    expiresInSeconds: resolved.expiresInSeconds,
  });
}
