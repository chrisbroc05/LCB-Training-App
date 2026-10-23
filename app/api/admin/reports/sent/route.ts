import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { getFreeSwingAnalysisResponseMode } from "@/lib/free-swing-analysis-response-server";
import { parseAdminSentReportLevelFilter } from "@/lib/admin-sent-reports-shared";
import {
  allowedSentReportTracks,
  buildSentReportsSummaryBaseWhere,
  buildSentWrittenReportsWhere,
  computeSentReportsSummary,
} from "@/lib/admin-sent-reports-server";
import { getDrillLibraryVideosByIds } from "@/lib/drill-library-videos";
import { serializeAdminSentReportRow } from "@/lib/written-report-send-server";
import { userOrgAccessSelect } from "@/lib/org-server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const level = parseAdminSentReportLevelFilter(url.searchParams.get("level"));
  const organizationId = url.searchParams.get("organizationId");
  const sentFrom = url.searchParams.get("sentFrom");
  const sentTo = url.searchParams.get("sentTo");
  const q = url.searchParams.get("q");

  const freeSwingMode = await getFreeSwingAnalysisResponseMode();
  const allowedTracks = allowedSentReportTracks(freeSwingMode);
  const freeWrittenReportsEnabled = freeSwingMode === "WRITTEN_REPORT";

  const listWhere = buildSentWrittenReportsWhere({
    allowedTracks,
    levelFilter: level,
    organizationId,
    sentFrom,
    sentTo,
    playerSearch: q,
  });

  const summaryBaseWhere = buildSentReportsSummaryBaseWhere(allowedTracks);

  const [summary, submissions, organizations] = await Promise.all([
    computeSentReportsSummary(summaryBaseWhere),
    prisma.swingAnalysisSubmission.findMany({
      where: listWhere,
      orderBy: { respondedAt: "desc" },
      take: 200,
      select: {
        id: true,
        playerName: true,
        createdAt: true,
        respondedAt: true,
        userEmail: true,
        reviewTrack: true,
        reportStrengths: true,
        reportAreasToImprove: true,
        reportRecommendedDrillLines: true,
        reportNoteFromCoach: true,
        reportLibraryDrillIds: true,
        reportRecommendedFixItSlug: true,
        evaluationPdfR2Key: true,
        _count: { select: { reportEditLogs: true } },
        user: {
          select: {
            membershipTier: true,
            membershipLevel: true,
            membershipLevelExpiresAt: true,
            playbookLegacyAccess: true,
            currentTeam: true,
            level: true,
            ...userOrgAccessSelect,
          },
        },
      },
    }),
    prisma.organization.findMany({
      where: {
        members: {
          some: {
            swingAnalysisSubmissions: {
              some: {
                status: "COMPLETED",
                evaluationPdfR2Key: { not: null },
                reviewTrack: { in: allowedTracks },
              },
            },
          },
        },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const reports = submissions.map((submission) => {
    const drillTitles = getDrillLibraryVideosByIds(submission.reportLibraryDrillIds).map(
      (video) => video.title,
    );
    return serializeAdminSentReportRow({ ...submission, drillTitles });
  });

  return NextResponse.json({
    summary,
    freeWrittenReportsEnabled,
    organizations,
    reports,
  });
}
