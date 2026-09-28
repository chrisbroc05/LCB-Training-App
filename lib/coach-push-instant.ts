import "server-only";

import { prisma } from "@/lib/prisma";
import {
  buildAdminSubmissionUrl,
  getCoachSubmissionTypeLabel,
  type CoachSubmissionTab,
} from "@/lib/coach-push-shared";
import { sendCoachAlertPushSafe } from "@/lib/coach-push-send";
import { getPlayerFirstName } from "@/lib/program-email-templates";

export async function sendCoachNewSubmissionPush(params: {
  submissionId: string;
  submissionTab: CoachSubmissionTab;
  playerName: string;
}) {
  const firstName = getPlayerFirstName(params.playerName, "Player");
  const typeLabel = getCoachSubmissionTypeLabel(params.submissionTab);

  return sendCoachAlertPushSafe({
    type: "COACH_NEW_SUBMISSION",
    dedupeKey: `coach:COACH_NEW_SUBMISSION:${params.submissionTab}:${params.submissionId}`,
    settingKey: "newVideosEnabled",
    message: {
      title: `New video from ${firstName}`,
      body: typeLabel,
      url: buildAdminSubmissionUrl(params.submissionTab, params.submissionId),
    },
  });
}

export async function sendCoachNewProgramPlayerPush(params: {
  enrollmentId: string;
  playerName: string;
  playerEmail: string;
}) {
  const name = params.playerName.trim() || params.playerEmail;

  return sendCoachAlertPushSafe({
    type: "COACH_NEW_PROGRAM_PLAYER",
    dedupeKey: `coach:COACH_NEW_PROGRAM_PLAYER:${params.enrollmentId}`,
    settingKey: "newProgramPlayersEnabled",
    message: {
      title: `New 12-week player: ${name}`,
      body: "Open their program page in admin.",
      url: `/admin/program/${params.enrollmentId}`,
    },
  });
}

export async function sendCoachNewProgramPlayerPushForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      programEnrollment: {
        select: { id: true },
      },
    },
  });

  if (!user?.programEnrollment) {
    return { sent: 0, skipped: true, reason: "no_enrollment" as const };
  }

  return sendCoachNewProgramPlayerPush({
    enrollmentId: user.programEnrollment.id,
    playerName: user.name ?? "",
    playerEmail: user.email,
  });
}
