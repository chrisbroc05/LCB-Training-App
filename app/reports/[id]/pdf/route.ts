import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveEvaluationPdfPresignedDownloadUrl } from "@/lib/evaluation-pdf-download-server";
import { verifyEvaluationReportPdfDownloadToken } from "@/lib/evaluation-report-pdf-token";
import { buildAuthRedirectPath } from "@/lib/email-layout";
import { getPublicAppUrl } from "@/lib/public-app-url";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const submissionId = (await context.params).id?.trim();
  if (!submissionId) {
    return NextResponse.json({ error: "Report id is required." }, { status: 400 });
  }

  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  const session = await getServerSession(authOptions);

  let userId = session?.user?.id ?? "";
  let userEmail = session?.user?.email ?? null;

  if (token) {
    const verified = verifyEvaluationReportPdfDownloadToken(token);
    if (!verified || verified.submissionId !== submissionId) {
      return NextResponse.json({ error: "Invalid or expired download link." }, { status: 403 });
    }
    userId = verified.userId;
  } else if (!userId) {
    const loginUrl = `${getPublicAppUrl()}${buildAuthRedirectPath(`/reports/${submissionId}/pdf`)}`;
    return NextResponse.redirect(loginUrl);
  }

  const resolved = await resolveEvaluationPdfPresignedDownloadUrl({
    submissionId,
    userId,
    userEmail,
  });

  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  return NextResponse.redirect(resolved.downloadUrl);
}
