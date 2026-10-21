export type CoachAlertSettingsState = {
  newVideosEnabled: boolean;
  newProgramPlayersEnabled: boolean;
  newMessagesEnabled: boolean;
  nightlySummaryPushEnabled: boolean;
  emailNightlySummaryEnabled: boolean;
};

export type CoachSubmissionTab = "swing" | "mental";

export function buildAdminSubmissionUrl(tab: CoachSubmissionTab, submissionId: string) {
  return `/admin?tab=${tab}&submissionId=${submissionId}`;
}

export function getCoachSubmissionTypeLabel(tab: CoachSubmissionTab) {
  return tab === "swing" ? "Swing analysis" : "Mental game";
}

import type { CoachDailySummaryBusiness } from "@/lib/coach-daily-summary-business-shared";

function snapshotBusinessHasContent(business: CoachDailySummaryBusiness | null | undefined) {
  if (!business) {
    return false;
  }

  return (
    business.sales.length > 0 ||
    business.newLeads.length > 0 ||
    business.checkoutFollowUps.length > 0 ||
    business.freeAccounts.length > 0
  );
}

export type CoachDailySummarySnapshot = {
  finished: number;
  active: number;
  finishedNames: string[];
  notFinished: Array<{ name: string; done: number; total: number }>;
  goneQuietNames: string[];
  newNotesCount: number;
  gamesLoggedToday: Array<{ name: string; line: string }>;
  videosWaiting: number;
  unreadMessagesCount: number;
  unconfirmedMinorNames: string[];
  quizCompletedToday: number;
  quizAverageScoreToday: number;
  business?: CoachDailySummaryBusiness | null;
};

export function coachDailySummaryHasContent(data: CoachDailySummarySnapshot) {
  return (
    snapshotBusinessHasContent(data.business) ||
    data.finished > 0 ||
    data.notFinished.length > 0 ||
    data.goneQuietNames.length > 0 ||
    data.newNotesCount > 0 ||
    data.gamesLoggedToday.length > 0 ||
    data.videosWaiting > 0 ||
    data.unreadMessagesCount > 0 ||
    data.unconfirmedMinorNames.length > 0 ||
    data.quizCompletedToday > 0
  );
}

export function buildCoachNightlySummaryLine(data: CoachDailySummarySnapshot) {
  const parts: string[] = [];

  if (data.finished > 0) {
    parts.push(`${data.finished} checked in`);
  }

  if (data.unreadMessagesCount > 0) {
    parts.push(
      `${data.unreadMessagesCount} unread message${data.unreadMessagesCount === 1 ? "" : "s"}`,
    );
  }

  if (data.videosWaiting > 0) {
    parts.push(
      `${data.videosWaiting} video${data.videosWaiting === 1 ? "" : "s"} waiting`,
    );
  }

  if (data.goneQuietNames.length > 0) {
    parts.push(
      `${data.goneQuietNames.length} gone quiet`,
    );
  }

  if (data.newNotesCount > 0) {
    parts.push(`${data.newNotesCount} new note${data.newNotesCount === 1 ? "" : "s"}`);
  }

  if (data.gamesLoggedToday.length > 0) {
    parts.push(
      `${data.gamesLoggedToday.length} game${data.gamesLoggedToday.length === 1 ? "" : "s"} logged`,
    );
  }

  if (data.notFinished.length > 0 && data.finished === 0) {
    parts.push(`${data.notFinished.length} still working`);
  }

  if (data.unconfirmedMinorNames.length > 0) {
    parts.push(
      `${data.unconfirmedMinorNames.length} parent${data.unconfirmedMinorNames.length === 1 ? "" : "s"} unconfirmed`,
    );
  }

  if (data.quizCompletedToday > 0) {
    parts.push(
      `Quiz: ${data.quizCompletedToday} completed, avg ${data.quizAverageScoreToday}`,
    );
  }

  return parts.join(", ");
}
