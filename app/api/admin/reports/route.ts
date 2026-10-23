import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { QUICK_WRITTEN_REPORT_TRACKS } from "@/lib/quick-written-report-shared";
import { serializeAdminQuickReportRow } from "@/lib/written-report-send-server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const submissions = await prisma.swingAnalysisSubmission.findMany({
    where: {
      status: "PENDING",
      reviewTrack: { in: [...QUICK_WRITTEN_REPORT_TRACKS] },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      playerName: true,
      createdAt: true,
      userEmail: true,
      reviewTrack: true,
      user: {
        select: {
          membershipTier: true,
          membershipLevel: true,
          membershipLevelExpiresAt: true,
          playbookLegacyAccess: true,
          organizationId: true,
          orgTrialQuickReportUsed: true,
          coreQuickReportNextEligibleAt: true,
          orgTeamId: true,
          currentTeam: true,
          level: true,
          organization: {
            select: {
              name: true,
              active: true,
              billingMode: true,
              coveredLevel: true,
              trialStartsAt: true,
              trialEndsAt: true,
            },
          },
          orgTeam: { select: { id: true, name: true, active: true } },
        },
      },
    },
  });

  return NextResponse.json({
    submissions: submissions.map((submission) => serializeAdminQuickReportRow(submission)),
  });
}
