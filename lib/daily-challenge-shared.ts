export const DAILY_CHALLENGE_AGE_GROUPS = ["AGE_8_11", "AGE_12_14", "AGE_15_PLUS"] as const;
export type DailyChallengeAgeGroupKey = (typeof DAILY_CHALLENGE_AGE_GROUPS)[number];

export const DAILY_QUESTION_TYPES = ["TRIVIA", "MINDSET"] as const;
export type DailyQuestionTypeKey = (typeof DAILY_QUESTION_TYPES)[number];

export const DAILY_CHALLENGE_EPOCH_DATE_KEY = "2026-01-01";
export const MINDSET_ANSWER_MAX_CHARS = 500;

export type DailyChallengeRecord = {
  id: string;
  ageGroup: DailyChallengeAgeGroupKey;
  rotationDay: number;
  title: string;
  instructions: string;
  drillLibraryVimeoId: string | null;
  active: boolean;
};

export type DailyQuestionRecord = {
  id: string;
  ageGroup: DailyChallengeAgeGroupKey | null;
  rotationDay: number;
  type: DailyQuestionTypeKey;
  prompt: string;
  options: string[];
  correctOptionIndex: number | null;
  explanation: string | null;
  active: boolean;
};

export type DailyChallengeContentPayload = {
  dateKey: string;
  isSunday: boolean;
  ageGroup: DailyChallengeAgeGroupKey | null;
  needsAge: boolean;
  challenge: {
    id: string;
    title: string;
    instructions: string;
    drillLibraryVimeoId: string | null;
    rotationDay: number;
  } | null;
  question: {
    id: string;
    type: DailyQuestionTypeKey;
    prompt: string;
    options: string[];
    explanation: string | null;
    /** Present after the player answers trivia so the UI can highlight the right option. */
    correctOptionIndex: number | null;
    rotationDay: number;
  } | null;
  completion: {
    challengeDone: boolean;
    triviaSelectedIndex: number | null;
    triviaCorrect: boolean | null;
    mindsetAnswer: string | null;
  };
  streak: number;
  completedAllTime: number;
  completedThisMonth: number;
  longestStreak: number;
};

export const DAILY_LEADERBOARD_SCOPES = ["all", "age", "org"] as const;
export type DailyLeaderboardScopeFilter = (typeof DAILY_LEADERBOARD_SCOPES)[number];

export type DailyLeaderboardEntry = {
  rank: number;
  userId: string;
  displayName: string;
  ageGroup: DailyChallengeAgeGroupKey | null;
  ageGroupLabel: string | null;
  completedThisMonth: number;
  streak: number;
  isSelf: boolean;
};

export type DailyLeaderboardViewerNotice =
  | { kind: "hidden_setting" }
  | { kind: "account_excluded" }
  | null;

export type DailyLeaderboardPayload = {
  scope: DailyLeaderboardScopeFilter;
  scopeLabel: string;
  ageGroup: DailyChallengeAgeGroupKey | null;
  ageGroupLabel: string | null;
  ageGroupFilterLabel: string | null;
  organizationId: string | null;
  organizationName: string | null;
  canFilterByOrg: boolean;
  monthKey: string;
  top: DailyLeaderboardEntry[];
  entries: DailyLeaderboardEntry[];
  self: DailyLeaderboardEntry | null;
  totalPlayers: number;
  viewerNotice: DailyLeaderboardViewerNotice;
};

export function isDailyChallengeAgeGroup(value: string): value is DailyChallengeAgeGroupKey {
  return (DAILY_CHALLENGE_AGE_GROUPS as readonly string[]).includes(value);
}

export function dailyChallengeAgeGroupLabel(ageGroup: DailyChallengeAgeGroupKey) {
  switch (ageGroup) {
    case "AGE_8_11":
      return "8-11";
    case "AGE_12_14":
      return "12-14";
    case "AGE_15_PLUS":
      return "15+";
  }
}

/** Filter tab label for the viewer's age group board. */
export function dailyChallengeAgeGroupFilterLabel(ageGroup: DailyChallengeAgeGroupKey) {
  switch (ageGroup) {
    case "AGE_8_11":
      return "Ages 8-11";
    case "AGE_12_14":
      return "Ages 12-14";
    case "AGE_15_PLUS":
      return "Ages 15 and up";
  }
}

export function isDailyLeaderboardScopeFilter(value: string): value is DailyLeaderboardScopeFilter {
  return (DAILY_LEADERBOARD_SCOPES as readonly string[]).includes(value);
}

export function formatDailyLeaderboardEntryPrimary(entry: Pick<DailyLeaderboardEntry, "displayName" | "ageGroupLabel">) {
  return entry.ageGroupLabel
    ? `${entry.displayName} | ${entry.ageGroupLabel}`
    : entry.displayName;
}

export function parseDailyChallengeAgeGroupLabel(raw: string): DailyChallengeAgeGroupKey | null {
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (normalized === "8-11" || normalized === "8_11" || normalized === "age_8_11") {
    return "AGE_8_11";
  }
  if (normalized === "12-14" || normalized === "12_14" || normalized === "age_12_14") {
    return "AGE_12_14";
  }
  if (
    normalized === "15+" ||
    normalized === "15" ||
    normalized === "15-plus" ||
    normalized === "15_plus" ||
    normalized === "age_15_plus"
  ) {
    return "AGE_15_PLUS";
  }
  return null;
}

/** Profile/legal age -> challenge age group. Under 8 maps to 8-11. */
export function resolveDailyChallengeAgeGroup(age: number | null | undefined): DailyChallengeAgeGroupKey | null {
  if (age === null || age === undefined || !Number.isFinite(age)) {
    return null;
  }
  if (age < 12) {
    return "AGE_8_11";
  }
  if (age < 15) {
    return "AGE_12_14";
  }
  return "AGE_15_PLUS";
}

export function preferredPlayerAge(profileAge: number | null | undefined, legalAge: number | null | undefined) {
  if (typeof profileAge === "number" && Number.isFinite(profileAge)) {
    return profileAge;
  }
  if (typeof legalAge === "number" && Number.isFinite(legalAge)) {
    return legalAge;
  }
  return null;
}

export function daysSinceDailyChallengeEpoch(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [epochYear, epochMonth, epochDay] = DAILY_CHALLENGE_EPOCH_DATE_KEY.split("-").map(Number);
  const current = Date.UTC(year, month - 1, day);
  const epoch = Date.UTC(epochYear, epochMonth - 1, epochDay);
  return Math.floor((current - epoch) / (24 * 60 * 60 * 1000));
}

export function pickRotationItem<T extends { rotationDay: number }>(items: T[], dateKey: string): T | null {
  if (items.length === 0) {
    return null;
  }
  const ordered = [...items].sort((a, b) => a.rotationDay - b.rotationDay);
  const days = Math.max(0, daysSinceDailyChallengeEpoch(dateKey));
  return ordered[days % ordered.length] ?? null;
}

export function questionTypeForChicagoDate(isSunday: boolean): DailyQuestionTypeKey {
  return isSunday ? "MINDSET" : "TRIVIA";
}

export function formatLeaderboardDisplayName(params: {
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  fallbackName: string | null | undefined;
  teamName?: string | null | undefined;
}) {
  const first =
    params.firstName?.trim() ||
    params.fallbackName?.trim().split(/\s+/)[0] ||
    "Player";
  const lastInitial = params.lastName?.trim()?.[0]?.toUpperCase() ?? "";
  const base = lastInitial ? `${first} ${lastInitial}.` : first;
  const team = params.teamName?.trim();
  return team ? `${base} (${team})` : base;
}

export function chicagoMonthPrefix(dateKey: string) {
  return dateKey.slice(0, 7);
}

export function previousChicagoDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - 1);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Consecutive days with challenge marked done, ending at today if done else yesterday. */
export function computeCurrentStreak(
  completedDateKeys: string[],
  todayKey: string,
): number {
  const done = new Set(completedDateKeys);
  let cursor = done.has(todayKey) ? todayKey : previousChicagoDateKey(todayKey);
  if (!done.has(cursor)) {
    return 0;
  }
  let streak = 0;
  while (done.has(cursor)) {
    streak += 1;
    cursor = previousChicagoDateKey(cursor);
  }
  return streak;
}

export function formatDailyLeaderboardStats(completedThisMonth: number, streak: number) {
  const streakLabel = streak === 1 ? "1-day streak" : `${streak}-day streak`;
  return `${completedThisMonth} done | ${streakLabel}`;
}

export function formatDailyChallengeDayDoneMessage(streak: number) {
  if (streak <= 1) {
    return "That's today done. Come back tomorrow to make it 2 days in a row!";
  }
  return `That's today done. Come back tomorrow and keep your ${streak}-day streak going!`;
}

export function dailyLeaderboardViewerNoticeCopy(
  notice: DailyLeaderboardViewerNotice,
): { primary: string; secondary: string | null } | null {
  if (!notice) {
    return null;
  }
  if (notice.kind === "hidden_setting") {
    return {
      primary: "You're not shown on the leaderboard",
      secondary: "Change this in Account settings.",
    };
  }
  return {
    primary: "This account isn't shown on leaderboards.",
    secondary: null,
  };
}

export function isDailyChallengeQuestionAnswered(completion: {
  triviaSelectedIndex: number | null;
  mindsetAnswer: string | null;
}, questionType: DailyQuestionTypeKey | null) {
  if (!questionType) {
    return true;
  }
  if (questionType === "TRIVIA") {
    return completion.triviaSelectedIndex !== null;
  }
  return Boolean(completion.mindsetAnswer);
}

export function computeLongestStreak(completedDateKeys: string[]): number {
  if (completedDateKeys.length === 0) {
    return 0;
  }
  const sorted = [...new Set(completedDateKeys)].sort();
  let longest = 1;
  let current = 1;
  for (let index = 1; index < sorted.length; index += 1) {
    const [year, month, day] = sorted[index - 1].split("-").map(Number);
    const next = new Date(Date.UTC(year, month - 1, day));
    next.setUTCDate(next.getUTCDate() + 1);
    const expected = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
    if (sorted[index] === expected) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}
