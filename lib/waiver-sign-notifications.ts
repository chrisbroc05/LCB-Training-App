import "server-only";

import { sendCoachAlertPushSafe } from "@/lib/coach-push-send";
import {
  buildWaiverPlayerFullName,
  formatWaiverSignupTypeLabel,
  type WaiverSignupType,
} from "@/lib/waiver-sign-shared";

export async function sendCoachWaiverSignedPush(params: {
  signatureId: string;
  playerFirstName: string;
  playerLastName: string;
  teamName: string | null;
  signupType: WaiverSignupType;
}) {
  const playerName = buildWaiverPlayerFullName(params.playerFirstName, params.playerLastName);
  const contextLabel = params.teamName?.trim() || formatWaiverSignupTypeLabel(params.signupType);

  return sendCoachAlertPushSafe({
    type: "COACH_WAIVER_SIGNED",
    dedupeKey: `coach:COACH_WAIVER_SIGNED:${params.signatureId}`,
    settingKey: "newProgramPlayersEnabled",
    message: {
      title: `Waiver signed: ${playerName} (${contextLabel})`,
      body: "Open waivers in admin.",
      url: "/admin/waivers",
    },
  });
}
