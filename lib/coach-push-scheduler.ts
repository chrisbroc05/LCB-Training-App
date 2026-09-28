import "server-only";

import {
  buildCoachNightlySummaryLine,
  coachDailySummaryHasContent,
  type CoachDailySummarySnapshot,
} from "@/lib/coach-push-shared";
import { sendCoachAlertPush } from "@/lib/coach-push-send";

export type ScheduledCoachPushPreview = {
  channel: "coach-push";
  type: "COACH_NIGHTLY_SUMMARY";
  title: string;
  body: string;
  url: string;
  dateKey: string;
};

export async function maybeSendCoachNightlySummaryPush(params: {
  dateKey: string;
  summaryData: CoachDailySummarySnapshot | null;
  dryRun: boolean;
  previews: ScheduledCoachPushPreview[];
}) {
  if (!params.summaryData || !coachDailySummaryHasContent(params.summaryData)) {
    return false;
  }

  const body = buildCoachNightlySummaryLine(params.summaryData);
  if (!body) {
    return false;
  }

  const title = "Today at LCB";
  const url = "/admin/program";
  const dedupeKey = `coach:COACH_NIGHTLY_SUMMARY:${params.dateKey}`;

  params.previews.push({
    channel: "coach-push",
    type: "COACH_NIGHTLY_SUMMARY",
    title,
    body,
    url,
    dateKey: params.dateKey,
  });

  if (params.dryRun) {
    return true;
  }

  const result = await sendCoachAlertPush({
    type: "COACH_NIGHTLY_SUMMARY",
    dedupeKey,
    settingKey: "nightlySummaryPushEnabled",
    message: {
      title,
      body,
      url,
    },
  });

  return result.sent > 0;
}

export async function sendTestCoachNightlySummaryPush(params: {
  dateKey: string;
  summaryData: CoachDailySummarySnapshot;
}) {
  const body = buildCoachNightlySummaryLine(params.summaryData);
  if (!body) {
    throw new Error("Nothing to include in the nightly summary push.");
  }

  const result = await sendCoachAlertPush({
    type: "COACH_NIGHTLY_SUMMARY",
    dedupeKey: `coach:COACH_NIGHTLY_SUMMARY:TEST:${Date.now()}`,
    settingKey: "nightlySummaryPushEnabled",
    skipDedupeCheck: true,
    message: {
      title: "Today at LCB",
      body,
      url: "/admin/program",
    },
  });

  if (result.sent === 0) {
    throw new Error(
      result.reason === "no_subscriptions"
        ? "Turn on coach alerts on this phone first."
        : "Unable to send test coach alert.",
    );
  }
}

export async function sendTestCoachNewSubmissionPush(params: {
  submissionTab: "swing" | "mental";
  submissionId: string;
  playerName: string;
}) {
  const {
    buildAdminSubmissionUrl,
    getCoachSubmissionTypeLabel,
  } = await import("@/lib/coach-push-shared");
  const { getPlayerFirstName } = await import("@/lib/program-email-templates");
  const firstName = getPlayerFirstName(params.playerName, "Player");
  const typeLabel = getCoachSubmissionTypeLabel(params.submissionTab);

  const result = await sendCoachAlertPush({
    type: "COACH_NEW_SUBMISSION",
    dedupeKey: `coach:COACH_NEW_SUBMISSION:TEST:${Date.now()}`,
    settingKey: "newVideosEnabled",
    skipDedupeCheck: true,
    message: {
      title: `New video from ${firstName}`,
      body: typeLabel,
      url: buildAdminSubmissionUrl(params.submissionTab, params.submissionId || "test"),
    },
  });

  if (result.sent === 0) {
    throw new Error(
      result.reason === "no_subscriptions"
        ? "Turn on coach alerts on this phone first."
        : "Unable to send test coach alert.",
    );
  }
}

export async function sendTestCoachNewProgramPlayerPush(params: {
  enrollmentId: string;
  playerName: string;
  playerEmail: string;
}) {
  const name = params.playerName.trim() || params.playerEmail;

  const result = await sendCoachAlertPush({
    type: "COACH_NEW_PROGRAM_PLAYER",
    dedupeKey: `coach:COACH_NEW_PROGRAM_PLAYER:TEST:${Date.now()}`,
    settingKey: "newProgramPlayersEnabled",
    skipDedupeCheck: true,
    message: {
      title: `New 12-week player: ${name}`,
      body: "Open their program page in admin.",
      url: `/admin/program/${params.enrollmentId || "test"}`,
    },
  });

  if (result.sent === 0) {
    throw new Error(
      result.reason === "no_subscriptions"
        ? "Turn on coach alerts on this phone first."
        : "Unable to send test coach alert.",
    );
  }
}
