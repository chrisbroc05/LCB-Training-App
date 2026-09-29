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
};

export function coachDailySummaryHasContent(data: CoachDailySummarySnapshot) {
  return (
    data.finished > 0 ||
    data.notFinished.length > 0 ||
    data.goneQuietNames.length > 0 ||
    data.newNotesCount > 0 ||
    data.gamesLoggedToday.length > 0 ||
    data.videosWaiting > 0 ||
    data.unreadMessagesCount > 0
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

  return parts.join(", ");
}
