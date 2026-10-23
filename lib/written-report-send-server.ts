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
import { mergeOrgIntoAccessFields, userOrgAccessSelect } from "@/lib/org-server";
import { formatEffectiveAccessLabel } from "@/lib/access-shared";
import type { DatabaseTier } from "@/lib/membership";
import type { ReportRecommendedFixItSlug } from "@/lib/player-evaluation-cta-shared";

function toCtaTrack(reviewTrack: CoachingReviewTrack): PlayerEvaluationCtaTrack {
  if (isQuickWrittenReportTrack(reviewTrack)) {
    return reviewTrack;
  }
  return "PLAYBOOK";
}

async function deliverQuickWrittenReportEmails(params: {
  userId: string;
  userEmail: string;
  playerName: string;
  submissionId: string;
  membershipTier: DatabaseTier | null;
  responseText: string;
  recommendedDrills: string[];
  evaluationPdfR2Key: string;
}) {
  const { downloadUrl } = await createPresignedEvaluationPdfDownloadUrl(params.evaluationPdfR2Key);

  const shouldSendEmail = await shouldSendNotificationEmail(
    params.userId,
    "notifySubmissionResponse",
  );

  if (shouldSendEmail) {
    await sendPlayerEvaluationReportEmail({
      toEmail: params.userEmail,
      playerName: params.playerName,
      submissionId: params.submissionId,
      pdfDownloadUrl: downloadUrl,
      recommendedDrillIds: params.recommendedDrills,
    });
  }

  void sendSecondEmailCoachResponseCopy({
    userId: params.userId,
    playerName: params.playerName,
    submissionId: params.submissionId,
    submissionType: "SWING_ANALYSIS",
    responseMode: "WRITTEN",
    membershipTier: params.membershipTier,
    writtenResponse: params.responseText,
    recommendedDrillIds: params.recommendedDrills,
  });
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
  recommendedFixItSlug?: ReportRecommendedFixItSlug | null;
}) {
  const existing = await prisma.swingAnalysisSubmission.findUnique({
    where: { id: params.submissionId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          membershipTier: true,
          membershipLevel: true,
          membershipLevelExpiresAt: true,
          playbookLegacyAccess: true,
          currentTeam: true,
          ...userOrgAccessSelect,
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
    recommendedFixItSlug: params.recommendedFixItSlug ?? null,
    user: existing.user,
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
        reportRecommendedFixItSlug: params.recommendedFixItSlug ?? null,
        recommendedDrills,
        evaluationPdfR2Key,
      },
    });

    await applyQuickReportAllowanceOnSend(tx, existing.userId, existing.reviewTrack!);
    return row;
  });

  await deliverQuickWrittenReportEmails({
    userId: updated.userId,
    userEmail: updated.userEmail,
    playerName: updated.playerName,
    submissionId: updated.id,
    membershipTier: existing.user.membershipTier,
    responseText,
    recommendedDrills,
    evaluationPdfR2Key,
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

async function loadCompletedQuickWrittenReport(submissionId: string) {
  const existing = await prisma.swingAnalysisSubmission.findUnique({
    where: { id: submissionId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          membershipTier: true,
          membershipLevel: true,
          membershipLevelExpiresAt: true,
          playbookLegacyAccess: true,
          currentTeam: true,
          ...userOrgAccessSelect,
        },
      },
    },
  });

  if (!existing) {
    return { ok: false as const, status: 404, error: "Submission not found." };
  }

  if (existing.status !== "COMPLETED" || !existing.evaluationPdfR2Key || !existing.respondedAt) {
    return { ok: false as const, status: 400, error: "This submission has no sent written report." };
  }

  if (!existing.reviewTrack || !isQuickWrittenReportTrack(existing.reviewTrack)) {
    return { ok: false as const, status: 400, error: "This submission is not a quick written report." };
  }

  return { ok: true as const, existing };
}

export async function resendQuickWrittenReportForSubmission(submissionId: string) {
  const loaded = await loadCompletedQuickWrittenReport(submissionId);
  if (!loaded.ok) {
    return loaded;
  }

  const { existing } = loaded;
  const recommendedDrills = existing.recommendedDrills ?? [];

  await deliverQuickWrittenReportEmails({
    userId: existing.userId,
    userEmail: existing.userEmail,
    playerName: existing.playerName,
    submissionId: existing.id,
    membershipTier: existing.user.membershipTier,
    responseText: existing.responseText ?? "",
    recommendedDrills,
    evaluationPdfR2Key: existing.evaluationPdfR2Key!,
  });

  return { ok: true as const, submissionId: existing.id };
}

export async function regenerateQuickWrittenReportForSubmission(params: {
  submissionId: string;
  sections: WrittenReportSections;
  libraryDrillIds: string[];
  recommendedFixItSlug?: ReportRecommendedFixItSlug | null;
  editedByAdminEmail: string;
}) {
  const loaded = await loadCompletedQuickWrittenReport(params.submissionId);
  if (!loaded.ok) {
    return loaded;
  }

  const { existing } = loaded;
  const parsedDrillIds = resolveDrillIdsFromReportLines(params.sections.recommendedDrills);
  const reportLibraryDrillIds = mergeReportLibraryDrillIds(
    params.libraryDrillIds,
    parsedDrillIds,
  );
  const recommendedDrills = mergeReportLibraryDrillIds(reportLibraryDrillIds, parsedDrillIds);
  const responseText = buildWrittenReportResponseText(params.sections);
  const respondedAt = existing.respondedAt!;
  const evaluationPdfR2Key = existing.evaluationPdfR2Key!;

  const pdfBuffer = await generatePlayerEvaluationPdfBuffer({
    playerName: existing.playerName,
    teamLabel: buildTeamLabel(existing.user),
    evalDate: respondedAt,
    sections: params.sections,
    libraryDrillIds: reportLibraryDrillIds,
    reviewTrack: toCtaTrack(existing.reviewTrack!),
    recommendedFixItSlug: params.recommendedFixItSlug ?? null,
    user: existing.user,
  });

  await uploadEvaluationPdfBuffer({ key: evaluationPdfR2Key, pdfBuffer });

  await prisma.$transaction(async (tx) => {
    await tx.swingAnalysisSubmission.update({
      where: { id: existing.id },
      data: {
        responseText,
        reportStrengths: params.sections.strengths,
        reportAreasToImprove: params.sections.areasToImprove,
        reportRecommendedDrillLines: params.sections.recommendedDrills,
        reportNoteFromCoach: params.sections.noteFromCoach,
        reportLibraryDrillIds,
        reportRecommendedFixItSlug: params.recommendedFixItSlug ?? null,
        recommendedDrills,
      },
    });

    await tx.swingAnalysisReportEditLog.create({
      data: {
        submissionId: existing.id,
        editedByAdminEmail: params.editedByAdminEmail,
      },
    });
  });

  return { ok: true as const, submissionId: existing.id };
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

export function serializeAdminSentReportRow(submission: {
  id: string;
  playerName: string;
  createdAt: Date;
  respondedAt: Date | null;
  userEmail: string;
  reviewTrack: CoachingReviewTrack | null;
  reportStrengths: string[];
  reportAreasToImprove: string[];
  reportRecommendedDrillLines: string[];
  reportNoteFromCoach: string | null;
  reportLibraryDrillIds: string[];
  reportRecommendedFixItSlug: string | null;
  evaluationPdfR2Key: string | null;
  _count?: { reportEditLogs: number };
  user: Parameters<typeof mergeOrgIntoAccessFields>[0] & {
    currentTeam?: string | null;
    level?: string | null;
    organization?: { id: string; name: string } | null;
    orgTeam?: { name: string } | null;
  };
  drillTitles: string[];
}) {
  const base = serializeAdminQuickReportRow(submission);
  const respondedAt = submission.respondedAt;
  const turnaroundMs =
    respondedAt != null ? respondedAt.getTime() - submission.createdAt.getTime() : null;

  return {
    ...base,
    submittedAt: submission.createdAt.toISOString(),
    sentAt: respondedAt?.toISOString() ?? null,
    turnaroundMs,
    drillCount: submission.reportLibraryDrillIds.length,
    drillTitles: submission.drillTitles,
    recommendedFixItSlug: submission.reportRecommendedFixItSlug,
    hasPdf: Boolean(submission.evaluationPdfR2Key),
    editCount: submission._count?.reportEditLogs ?? 0,
    organizationId: submission.user.organization?.id ?? null,
    sections: {
      strengths: submission.reportStrengths,
      areasToImprove: submission.reportAreasToImprove,
      recommendedDrills: submission.reportRecommendedDrillLines,
      noteFromCoach: submission.reportNoteFromCoach ?? "",
    },
    libraryDrillIds: submission.reportLibraryDrillIds,
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
