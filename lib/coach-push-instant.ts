import "server-only";

import { prisma } from "@/lib/prisma";
import {
  buildAdminCoachingReportsUrl,
  buildAdminSubmissionUrl,
  coachNewProgramPlayerPushTitle,
  getCoachSubmissionTypeLabel,
  type CoachSubmissionTab,
} from "@/lib/coach-push-shared";
import { sendCoachAlertPushSafe } from "@/lib/coach-push-send";
import { getPlayerFirstName } from "@/lib/program-email-templates";

export async function sendCoachNewSubmissionPush(params: {
  submissionId: string;
  submissionTab: CoachSubmissionTab;
  playerName: string;
  notificationKind?: "VIDEO_REVIEW" | "WRITTEN_REPORT";
  effectivePlanLabel?: string | null;
}) {
  const firstName = getPlayerFirstName(params.playerName, "Player");
  const isWrittenReport = params.notificationKind === "WRITTEN_REPORT";
  const typeLabel = isWrittenReport
    ? params.effectivePlanLabel?.trim() || "Written report"
    : getCoachSubmissionTypeLabel(params.submissionTab);
  const url = isWrittenReport
    ? buildAdminCoachingReportsUrl(params.submissionId, "pending")
    : buildAdminSubmissionUrl(params.submissionTab, params.submissionId);

  return sendCoachAlertPushSafe({
    type: "COACH_NEW_SUBMISSION",
    dedupeKey: `coach:COACH_NEW_SUBMISSION:${params.submissionTab}:${params.submissionId}`,
    settingKey: "newVideosEnabled",
    message: {
      title: isWrittenReport ? `Swing report requested: ${firstName}` : `New video from ${firstName}`,
      body: isWrittenReport ? "Report requested" : typeLabel,
      url,
    },
  });
}

export async function sendCoachNewProgramPlayerPush(params: {
  enrollmentId: string;
  playerName: string;
  playerEmail: string;
  allAccess?: boolean;
}) {
  const title = coachNewProgramPlayerPushTitle(params);

  return sendCoachAlertPushSafe({
    type: "COACH_NEW_PROGRAM_PLAYER",
    dedupeKey: `coach:COACH_NEW_PROGRAM_PLAYER:${params.enrollmentId}`,
    settingKey: "newProgramPlayersEnabled",
    message: {
      title,
      body: "Open their program page in admin.",
      url: `/admin/coaching/program/${params.enrollmentId}`,
    },
  });
}

export async function sendCoachRefundProcessedPush(params: {
  chargeId: string;
  playerName: string;
  dedupeKey: string;
}) {
  const name = params.playerName.trim() || "Player";

  return sendCoachAlertPushSafe({
    type: "COACH_REFUND_PROCESSED",
    dedupeKey: params.dedupeKey,
    settingKey: "newProgramPlayersEnabled",
    message: {
      title: `Refund processed for ${name}`,
      body: "Program access removed.",
      url: "/admin",
    },
  });
}

export async function sendCoachNewProgramPlayerPushForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      membershipLevel: true,
      isTestAccount: true,
      programEnrollment: {
        select: { id: true },
      },
    },
  });

  if (!user?.programEnrollment) {
    return { sent: 0, skipped: true, reason: "no_enrollment" as const };
  }

  if (user.isTestAccount) {
    return { sent: 0, skipped: true, reason: "test_account" as const };
  }

  return sendCoachNewProgramPlayerPush({
    enrollmentId: user.programEnrollment.id,
    playerName: user.name ?? "",
    playerEmail: user.email,
    allAccess: user.membershipLevel === "ALL_ACCESS",
  });
}
