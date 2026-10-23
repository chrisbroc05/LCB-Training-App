import "server-only";

import type { CoachingReviewTrack } from "@prisma/client";
import { createAppNotification } from "@/lib/app-notifications";
import {
  applyQuickReportAllowanceOnSend,
} from "@/lib/coaching-submissions";
import { parseRecommendedDrillsFormValue } from "@/lib/drill-library-videos";
import { sendPlayerEvaluationReportEmail } from "@/lib/notifications";
import {
  generatePlayerEvaluationPdfBuffer,
} from "@/lib/player-evaluation-pdf-server";
import type { PlayerEvaluationCtaTrack } from "@/lib/player-evaluation-cta-shared";
import { sendCoachResponsePush } from "@/lib/push-instant";
import { prisma } from "@/lib/prisma";
import { isQuickWrittenReportTrack } from "@/lib/quick-written-report-shared";
import {
  buildEvaluationPdfKey,
  createPresignedEvaluationPdfDownloadUrl,
  uploadEvaluationPdfBuffer,
} from "@/lib/r2";
import { sendSecondEmailCoachResponseCopy } from "@/lib/second-email-send";
import { shouldSendNotificationEmail } from "@/lib/user-notification-preferences";
import {
  buildWrittenReportResponseText,
  type WrittenReportSections,
} from "@/lib/written-report-parse-shared";
import {
  mergeReportLibraryDrillIds,
  resolveDrillIdsFromReportLines,
} from "@/lib/written-report-drill-grants-shared";
import { mergeOrgIntoAccessFields } from "@/lib/org-server";
import { formatEffectiveAccessLabel } from "@/lib/access-shared";

function toCtaTrack(reviewTrack: CoachingReviewTrack): PlayerEvaluationCtaTrack {
  if (isQuickWrittenReportTrack(reviewTrack)) {
    return reviewTrack;
  }
  return "PLAYBOOK";
}

function buildTeamLabel(user: {
  currentTeam: string | null;
  orgTeam: { name: string } | null;
  organization: { name: string } | null;
}) {
  if (user.currentTeam?.trim()) {
    return user.currentTeam.trim();
  }
  if (user.orgTeam?.name && user.organization?.name) {
    return `${user.organization.name} - ${user.orgTeam.name}`;
  }
  return user.organization?.name?.trim() ?? "LCB Training";
}

export async function sendQuickWrittenReportForSubmission(params: {
  submissionId: string;
  sections: WrittenReportSections;
  libraryDrillIds: string[];
}) {
  const existing = await prisma.swingAnalysisSubmission.findUnique({
    where: { id: params.submissionId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          membershipTier: true,
          currentTeam: true,
          organization: { select: { name: true } },
          orgTeam: { select: { name: true } },
        },
      },
    },
  });

  if (!existing) {
    return { ok: false as const, status: 404, error: "Submission not found." };
  }

  if (existing.status !== "PENDING") {
    return { ok: false as const, status: 400, error: "This submission was already completed." };
  }

  if (!existing.reviewTrack || !isQuickWrittenReportTrack(existing.reviewTrack)) {
    return { ok: false as const, status: 400, error: "This submission is not a quick written report." };
  }

  const parsedDrillIds = resolveDrillIdsFromReportLines(params.sections.recommendedDrills);
  const reportLibraryDrillIds = mergeReportLibraryDrillIds(
    params.libraryDrillIds,
    parsedDrillIds,
  );
  const recommendedDrills = mergeReportLibraryDrillIds(reportLibraryDrillIds, parsedDrillIds);
  const responseText = buildWrittenReportResponseText(params.sections);
  const respondedAt = new Date();

  const pdfBuffer = await generatePlayerEvaluationPdfBuffer({
    playerName: existing.playerName,
    teamLabel: buildTeamLabel(existing.user),
    evalDate: respondedAt,
    sections: params.sections,
    libraryDrillIds: reportLibraryDrillIds,
    reviewTrack: toCtaTrack(existing.reviewTrack),
  });

  const evaluationPdfR2Key = buildEvaluationPdfKey(existing.id);
  await uploadEvaluationPdfBuffer({ key: evaluationPdfR2Key, pdfBuffer });

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.swingAnalysisSubmission.update({
      where: { id: existing.id },
      data: {
        status: "COMPLETED",
        respondedAt,
        responseText,
        reportStrengths: params.sections.strengths,
        reportAreasToImprove: params.sections.areasToImprove,
        reportRecommendedDrillLines: params.sections.recommendedDrills,
        reportNoteFromCoach: params.sections.noteFromCoach,
        reportLibraryDrillIds,
        recommendedDrills,
        evaluationPdfR2Key,
      },
    });

    await applyQuickReportAllowanceOnSend(tx, existing.userId, existing.reviewTrack!);
    return row;
  });

  const { downloadUrl } = await createPresignedEvaluationPdfDownloadUrl(evaluationPdfR2Key);

  const shouldSendEmail = await shouldSendNotificationEmail(
    updated.userId,
    "notifySubmissionResponse",
  );

  if (shouldSendEmail) {
    await sendPlayerEvaluationReportEmail({
      toEmail: updated.userEmail,
      playerName: updated.playerName,
      submissionId: updated.id,
      pdfDownloadUrl: downloadUrl,
      recommendedDrillIds: recommendedDrills,
    });
  }

  void sendSecondEmailCoachResponseCopy({
    userId: updated.userId,
    playerName: updated.playerName,
    submissionId: updated.id,
    submissionType: "SWING_ANALYSIS",
    responseMode: "WRITTEN",
    membershipTier: existing.user.membershipTier,
    writtenResponse: responseText,
    recommendedDrillIds: recommendedDrills,
  });

  void sendCoachResponsePush({
    userId: updated.userId,
    submissionType: "SWING_ANALYSIS",
    submissionId: updated.id,
  });

  await createAppNotification({
    userId: updated.userId,
    title: "Your player evaluation is ready",
    body: "Coach Broc sent your written report and PDF.",
    type: "submission_response",
    linkUrl: `/profile?type=swing&id=${updated.id}`,
  });

  return { ok: true as const, submissionId: updated.id };
}

export function serializeAdminQuickReportRow(submission: {
  id: string;
  playerName: string;
  createdAt: Date;
  userEmail: string;
  reviewTrack: CoachingReviewTrack | null;
  user: Parameters<typeof mergeOrgIntoAccessFields>[0] & {
    currentTeam?: string | null;
    level?: string | null;
    organization?: { name: string } | null;
    orgTeam?: { name: string } | null;
  };
}) {
  const accessFields = mergeOrgIntoAccessFields(submission.user);
  return {
    id: submission.id,
    playerName: submission.playerName,
    createdAt: submission.createdAt.toISOString(),
    userEmail: submission.userEmail,
    reviewTrack: submission.reviewTrack,
    levelLabel: formatEffectiveAccessLabel(accessFields),
    organizationName: submission.user.organization?.name ?? null,
    teamName: submission.user.orgTeam?.name ?? submission.user.currentTeam ?? null,
  };
}

export function parseWrittenReportLibraryDrillIds(value: unknown) {
  if (Array.isArray(value)) {
    const ids = value
      .map((entry) => String(entry).trim())
      .filter((entry) => entry.length > 0);
    if (ids.length > 2) {
      return { ok: false as const, error: "Select up to 2 library drills." };
    }
    return { ok: true as const, ids };
  }

  if (typeof value === "string") {
    return parseRecommendedDrillsFormValue(value);
  }

  return { ok: true as const, ids: [] as string[] };
}
