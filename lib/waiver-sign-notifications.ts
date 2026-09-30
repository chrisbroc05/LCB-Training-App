import "server-only";

import { sendCoachAlertPushSafe } from "@/lib/coach-push-send";
import { formatWaiverSignupTypeLabel, type WaiverSignupType } from "@/lib/waiver-sign-shared";

export async function sendCoachWaiverSignedPush(params: {
  submissionBatchId: string;
  playerNames: string[];
  teamName: string | null;
  signupType: WaiverSignupType;
}) {
  const playersLabel = params.playerNames.join(", ");
  const contextLabel = params.teamName?.trim() || formatWaiverSignupTypeLabel(params.signupType);

  return sendCoachAlertPushSafe({
    type: "COACH_WAIVER_SIGNED",
    dedupeKey: `coach:COACH_WAIVER_SIGNED:${params.submissionBatchId}`,
    settingKey: "newProgramPlayersEnabled",
    message: {
      title: `Waiver signed: ${playersLabel} (${contextLabel})`,
      body: "Open waivers in admin.",
      url: "/admin/waivers",
    },
  });
}
