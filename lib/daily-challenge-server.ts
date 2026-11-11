import "server-only";

import type {
  DailyChallengeAgeGroup,
  DailyQuestionType,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getChicagoDateTimeParts,
  getChicagoWeekdayIndexForDateKey,
} from "@/lib/program-email-chicago";
import { buildPushDedupeKey, sendPushToUser, userHasPushSubscriptions } from "@/lib/push-send";
import {
  chicagoMonthPrefix,
  computeCurrentStreak,
  computeLongestStreak,
  dailyChallengeAgeGroupLabel,
  formatLeaderboardDisplayName,
  MINDSET_ANSWER_MAX_CHARS,
  pickRotationItem,
  preferredPlayerAge,
  previousChicagoDateKey,
  questionTypeForChicagoDate,
  resolveDailyChallengeAgeGroup,
  type DailyChallengeAgeGroupKey,
  type DailyChallengeContentPayload,
  type DailyLeaderboardEntry,
  type DailyLeaderboardPayload,
  type DailyQuestionTypeKey,
} from "@/lib/daily-challenge-shared";

export type {
  DailyChallengeContentPayload,
  DailyLeaderboardEntry,
  DailyLeaderboardPayload,
};

type ContentUser = {
  id: string;
  age: number | null;
  playerAge: number | null;
  hideFromLeaderboards: boolean;
  isTestAccount: boolean;
  clubReportExcluded: boolean;
  playerFirstName: string | null;
  playerLastName: string | null;
  name: string | null;
  organizationId: string | null;
  organization: { id: string; name: string } | null;
  orgTeam: { id: string; name: string } | null;
};

const contentUserSelect = {
  id: true,
  age: true,
  playerAge: true,
  hideFromLeaderboards: true,
  isTestAccount: true,
  clubReportExcluded: true,
  playerFirstName: true,
  playerLastName: true,
  name: true,
  organizationId: true,
  organization: { select: { id: true, name: true } },
  orgTeam: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;

export async function getDailyChallengeSettings() {
  return prisma.dailyChallengeSettings.upsert({
    where: { id: "default" },
    create: { id: "default", pushHourChicago: 15, pushMinuteChicago: 30 },
    update: {},
  });
}

export async function updateDailyChallengeSettings(params: {
  pushHourChicago: number;
  pushMinuteChicago: number;
}) {
  return prisma.dailyChallengeSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      pushHourChicago: params.pushHourChicago,
      pushMinuteChicago: params.pushMinuteChicago,
    },
    update: {
      pushHourChicago: params.pushHourChicago,
      pushMinuteChicago: params.pushMinuteChicago,
    },
  });
}

function isSundayDateKey(dateKey: string) {
  return getChicagoWeekdayIndexForDateKey(dateKey) === 6;
}

export async function loadRotationChallenge(
  ageGroup: DailyChallengeAgeGroupKey,
  dateKey: string,
) {
  const items = await prisma.dailyChallenge.findMany({
    where: { ageGroup, active: true },
    orderBy: { rotationDay: "asc" },
  });
  return pickRotationItem(items, dateKey);
}

export async function loadRotationQuestion(
  ageGroup: DailyChallengeAgeGroupKey,
  dateKey: string,
) {
  const type = questionTypeForChicagoDate(isSundayDateKey(dateKey));
  const items = await prisma.dailyQuestion.findMany({
    where: {
      type,
      active: true,
      OR: [{ ageGroup }, { ageGroup: null }],
    },
    orderBy: [{ rotationDay: "asc" }, { createdAt: "asc" }],
  });
  return pickRotationItem(items, dateKey);
}

export async function previewDailyChallengeForDate(dateKey: string) {
  const sunday = isSundayDateKey(dateKey);
  const groups: DailyChallengeAgeGroupKey[] = ["AGE_8_11", "AGE_12_14", "AGE_15_PLUS"];
  const rows = [];
  for (const ageGroup of groups) {
    const challenge = await loadRotationChallenge(ageGroup, dateKey);
    const question = await loadRotationQuestion(ageGroup, dateKey);
    rows.push({
      ageGroup,
      ageGroupLabel: dailyChallengeAgeGroupLabel(ageGroup),
      challenge: challenge
        ? {
            id: challenge.id,
            title: challenge.title,
            instructions: challenge.instructions,
            rotationDay: challenge.rotationDay,
            drillLibraryVimeoId: challenge.drillLibraryVimeoId,
          }
        : null,
      question: question
        ? {
            id: question.id,
            type: question.type as DailyQuestionTypeKey,
            prompt: question.prompt,
            options: question.options,
            correctOptionIndex: question.correctOptionIndex,
            explanation: question.explanation,
            rotationDay: question.rotationDay,
            ageGroup: question.ageGroup,
          }
        : null,
      questionType: questionTypeForChicagoDate(sunday),
    });
  }
  return { dateKey, isSunday: sunday, rows };
}

async function loadContentUser(userId: string): Promise<ContentUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: contentUserSelect,
  });
}

async function loadUserCompletionStats(userId: string, dateKey: string) {
  const monthPrefix = chicagoMonthPrefix(dateKey);
  const completions = await prisma.dailyChallengeCompletion.findMany({
    where: {
      userId,
      challengeDoneAt: { not: null },
    },
    select: { chicagoDate: true },
    orderBy: { chicagoDate: "asc" },
  });
  const dateKeys = completions.map((row) => row.chicagoDate);
  return {
    streak: computeCurrentStreak(dateKeys, dateKey),
    completedAllTime: dateKeys.length,
    completedThisMonth: dateKeys.filter((key) => key.startsWith(monthPrefix)).length,
    longestStreak: computeLongestStreak(dateKeys),
    dateKeys,
  };
}

export async function loadDailyChallengeContentForUser(
  userId: string,
  now = new Date(),
): Promise<DailyChallengeContentPayload | null> {
  const user = await loadContentUser(userId);
  if (!user) {
    return null;
  }

  const { dateKey, isSunday } = getChicagoDateTimeParts(now);
  const age = preferredPlayerAge(user.age, user.playerAge);
  const ageGroup = resolveDailyChallengeAgeGroup(age);
  const stats = await loadUserCompletionStats(userId, dateKey);

  if (!ageGroup) {
    return {
      dateKey,
      isSunday,
      ageGroup: null,
      needsAge: true,
      challenge: null,
      question: null,
      completion: {
        challengeDone: false,
        triviaSelectedIndex: null,
        triviaCorrect: null,
        mindsetAnswer: null,
      },
      streak: stats.streak,
      completedAllTime: stats.completedAllTime,
      completedThisMonth: stats.completedThisMonth,
      longestStreak: stats.longestStreak,
    };
  }

  const [challenge, question, completion] = await Promise.all([
    loadRotationChallenge(ageGroup, dateKey),
    loadRotationQuestion(ageGroup, dateKey),
    prisma.dailyChallengeCompletion.findUnique({
      where: { userId_chicagoDate: { userId, chicagoDate: dateKey } },
    }),
  ]);

  return {
    dateKey,
    isSunday,
    ageGroup,
    needsAge: false,
    challenge: challenge
      ? {
          id: challenge.id,
          title: challenge.title,
          instructions: challenge.instructions,
          drillLibraryVimeoId: challenge.drillLibraryVimeoId,
          rotationDay: challenge.rotationDay,
        }
      : null,
    question: question
      ? (() => {
          const triviaAnswered =
            question.type === "TRIVIA" &&
            completion?.triviaSelectedIndex !== null &&
            completion?.triviaSelectedIndex !== undefined;
          return {
            id: question.id,
            type: question.type as DailyQuestionTypeKey,
            prompt: question.prompt,
            options: question.options,
            explanation: triviaAnswered ? question.explanation : null,
            correctOptionIndex: triviaAnswered ? question.correctOptionIndex : null,
            rotationDay: question.rotationDay,
          };
        })()
      : null,
    completion: {
      challengeDone: Boolean(completion?.challengeDoneAt),
      triviaSelectedIndex: completion?.triviaSelectedIndex ?? null,
      triviaCorrect: completion?.triviaCorrect ?? null,
      mindsetAnswer: completion?.mindsetAnswer ?? null,
    },
    streak: stats.streak,
    completedAllTime: stats.completedAllTime,
    completedThisMonth: stats.completedThisMonth,
    longestStreak: stats.longestStreak,
  };
}

/** After answering trivia, include explanation even before Done. */
export function withRevealedQuestionExplanation(
  payload: DailyChallengeContentPayload,
  explanation: string | null,
): DailyChallengeContentPayload {
  if (!payload.question) {
    return payload;
  }
  const answered =
    payload.completion.triviaSelectedIndex !== null ||
    Boolean(payload.completion.mindsetAnswer);
  if (!answered) {
    return payload;
  }
  return {
    ...payload,
    question: {
      ...payload.question,
      explanation,
    },
  };
}

export async function setPlayerAgeForDailyChallenge(userId: string, age: number) {
  if (!Number.isInteger(age) || age < 5 || age > 25) {
    return { ok: false as const, error: "Enter an age between 5 and 25." };
  }
  await prisma.user.update({
    where: { id: userId },
    data: { age, playerAge: age },
  });
  return { ok: true as const };
}

async function ensureCompletionRow(params: {
  userId: string;
  dateKey: string;
  ageGroup: DailyChallengeAgeGroup;
  challengeId: string;
  questionId: string | null;
}) {
  return prisma.dailyChallengeCompletion.upsert({
    where: {
      userId_chicagoDate: { userId: params.userId, chicagoDate: params.dateKey },
    },
    create: {
      userId: params.userId,
      chicagoDate: params.dateKey,
      ageGroup: params.ageGroup,
      challengeId: params.challengeId,
      questionId: params.questionId,
    },
    update: {
      ageGroup: params.ageGroup,
      challengeId: params.challengeId,
      questionId: params.questionId ?? undefined,
    },
  });
}

export async function markDailyChallengeDone(userId: string, now = new Date()) {
  const user = await loadContentUser(userId);
  if (!user) {
    return { ok: false as const, error: "User not found." };
  }
  const age = preferredPlayerAge(user.age, user.playerAge);
  const ageGroup = resolveDailyChallengeAgeGroup(age);
  if (!ageGroup) {
    return { ok: false as const, error: "Set your age to unlock today's challenge." };
  }

  const { dateKey } = getChicagoDateTimeParts(now);
  const challenge = await loadRotationChallenge(ageGroup, dateKey);
  if (!challenge) {
    return { ok: false as const, error: "No challenge is available for today yet." };
  }
  const question = await loadRotationQuestion(ageGroup, dateKey);

  const existing = await prisma.dailyChallengeCompletion.findUnique({
    where: { userId_chicagoDate: { userId, chicagoDate: dateKey } },
  });
  if (existing?.challengeDoneAt) {
    return { ok: true as const, alreadyDone: true as const };
  }

  await ensureCompletionRow({
    userId,
    dateKey,
    ageGroup,
    challengeId: challenge.id,
    questionId: question?.id ?? null,
  });
  await prisma.dailyChallengeCompletion.update({
    where: { userId_chicagoDate: { userId, chicagoDate: dateKey } },
    data: { challengeDoneAt: now },
  });

  return { ok: true as const, alreadyDone: false as const };
}

export async function submitDailyTriviaAnswer(
  userId: string,
  selectedIndex: number,
  now = new Date(),
) {
  const user = await loadContentUser(userId);
  if (!user) {
    return { ok: false as const, error: "User not found." };
  }
  const age = preferredPlayerAge(user.age, user.playerAge);
  const ageGroup = resolveDailyChallengeAgeGroup(age);
  if (!ageGroup) {
    return { ok: false as const, error: "Set your age to unlock today's challenge." };
  }

  const { dateKey, isSunday } = getChicagoDateTimeParts(now);
  if (isSunday) {
    return { ok: false as const, error: "Today is a mindset day." };
  }

  const challenge = await loadRotationChallenge(ageGroup, dateKey);
  const question = await loadRotationQuestion(ageGroup, dateKey);
  if (!challenge || !question || question.type !== "TRIVIA") {
    return { ok: false as const, error: "No trivia question is available today." };
  }
  if (
    !Number.isInteger(selectedIndex) ||
    selectedIndex < 0 ||
    selectedIndex >= question.options.length
  ) {
    return { ok: false as const, error: "Pick a valid answer." };
  }

  const existing = await prisma.dailyChallengeCompletion.findUnique({
    where: { userId_chicagoDate: { userId, chicagoDate: dateKey } },
  });
  if (existing?.triviaSelectedIndex !== null && existing?.triviaSelectedIndex !== undefined) {
    return {
      ok: true as const,
      alreadyAnswered: true as const,
      correct: existing.triviaCorrect,
      selectedIndex: existing.triviaSelectedIndex,
      explanation: question.explanation,
      correctOptionIndex: question.correctOptionIndex,
    };
  }

  const correct = question.correctOptionIndex === selectedIndex;
  await ensureCompletionRow({
    userId,
    dateKey,
    ageGroup,
    challengeId: challenge.id,
    questionId: question.id,
  });
  await prisma.dailyChallengeCompletion.update({
    where: { userId_chicagoDate: { userId, chicagoDate: dateKey } },
    data: {
      triviaSelectedIndex: selectedIndex,
      triviaCorrect: correct,
      questionId: question.id,
    },
  });

  return {
    ok: true as const,
    alreadyAnswered: false as const,
    correct,
    selectedIndex,
    explanation: question.explanation,
    correctOptionIndex: question.correctOptionIndex,
  };
}

export async function submitDailyMindsetAnswer(
  userId: string,
  answer: string,
  now = new Date(),
) {
  const trimmed = answer.trim();
  if (!trimmed) {
    return { ok: false as const, error: "Write a short answer." };
  }
  if (trimmed.length > MINDSET_ANSWER_MAX_CHARS) {
    return {
      ok: false as const,
      error: `Keep your answer under ${MINDSET_ANSWER_MAX_CHARS} characters.`,
    };
  }

  const user = await loadContentUser(userId);
  if (!user) {
    return { ok: false as const, error: "User not found." };
  }
  const age = preferredPlayerAge(user.age, user.playerAge);
  const ageGroup = resolveDailyChallengeAgeGroup(age);
  if (!ageGroup) {
    return { ok: false as const, error: "Set your age to unlock today's challenge." };
  }

  const { dateKey, isSunday } = getChicagoDateTimeParts(now);
  if (!isSunday) {
    return { ok: false as const, error: "Mindset answers are for Sundays." };
  }

  const challenge = await loadRotationChallenge(ageGroup, dateKey);
  const question = await loadRotationQuestion(ageGroup, dateKey);
  if (!challenge || !question || question.type !== "MINDSET") {
    return { ok: false as const, error: "No mindset prompt is available today." };
  }

  const existing = await prisma.dailyChallengeCompletion.findUnique({
    where: { userId_chicagoDate: { userId, chicagoDate: dateKey } },
  });
  if (existing?.mindsetAnswer) {
    return {
      ok: true as const,
      alreadyAnswered: true as const,
      answer: existing.mindsetAnswer,
    };
  }

  await ensureCompletionRow({
    userId,
    dateKey,
    ageGroup,
    challengeId: challenge.id,
    questionId: question.id,
  });
  await prisma.dailyChallengeCompletion.update({
    where: { userId_chicagoDate: { userId, chicagoDate: dateKey } },
    data: { mindsetAnswer: trimmed, questionId: question.id },
  });

  return { ok: true as const, alreadyAnswered: false as const, answer: trimmed };
}

function leaderboardEligibleWhere(organizationId: string | null): Prisma.UserWhereInput {
  return {
    isTestAccount: false,
    clubReportExcluded: false,
    hideFromLeaderboards: false,
    ...(organizationId ? { organizationId } : {}),
  };
}

export async function loadDailyLeaderboardForUser(
  userId: string,
  now = new Date(),
): Promise<DailyLeaderboardPayload | null> {
  const user = await loadContentUser(userId);
  if (!user) {
    return null;
  }
  const age = preferredPlayerAge(user.age, user.playerAge);
  const ageGroup = resolveDailyChallengeAgeGroup(age);
  if (!ageGroup) {
    return null;
  }

  const { dateKey } = getChicagoDateTimeParts(now);
  const monthPrefix = chicagoMonthPrefix(dateKey);
  const orgScoped = Boolean(user.organizationId);
  const scopeOrgId = orgScoped ? user.organizationId : null;

  const eligibleUsers = await prisma.user.findMany({
    where: leaderboardEligibleWhere(scopeOrgId),
    select: {
      id: true,
      playerFirstName: true,
      playerLastName: true,
      name: true,
      age: true,
      playerAge: true,
      orgTeam: { select: { name: true } },
      organization: { select: { name: true } },
    },
  });

  const ageFiltered = eligibleUsers.filter((row) => {
    const rowAge = preferredPlayerAge(row.age, row.playerAge);
    return resolveDailyChallengeAgeGroup(rowAge) === ageGroup;
  });
  const userIds = ageFiltered.map((row) => row.id);

  const completions =
    userIds.length === 0
      ? []
      : await prisma.dailyChallengeCompletion.findMany({
          where: {
            userId: { in: userIds },
            challengeDoneAt: { not: null },
          },
          select: { userId: true, chicagoDate: true },
        });

  const byUser = new Map<string, string[]>();
  for (const row of completions) {
    const list = byUser.get(row.userId) ?? [];
    list.push(row.chicagoDate);
    byUser.set(row.userId, list);
  }

  const ranked = ageFiltered
    .map((row) => {
      const dates = byUser.get(row.id) ?? [];
      const completedThisMonth = dates.filter((key) => key.startsWith(monthPrefix)).length;
      const streak = computeCurrentStreak(dates, dateKey);
      return {
        userId: row.id,
        displayName: formatLeaderboardDisplayName({
          firstName: row.playerFirstName,
          lastName: row.playerLastName,
          fallbackName: row.name,
          teamName: orgScoped ? row.orgTeam?.name ?? null : null,
        }),
        completedThisMonth,
        streak,
      };
    })
    .filter((row) => row.completedThisMonth > 0)
    .sort((a, b) => {
      if (b.completedThisMonth !== a.completedThisMonth) {
        return b.completedThisMonth - a.completedThisMonth;
      }
      if (b.streak !== a.streak) {
        return b.streak - a.streak;
      }
      return a.displayName.localeCompare(b.displayName);
    });

  const withRank: DailyLeaderboardEntry[] = ranked.map((row, index) => ({
    ...row,
    rank: index + 1,
    isSelf: row.userId === userId,
  }));

  const self = withRank.find((row) => row.userId === userId) ?? null;

  const scopeLabel = orgScoped
    ? `${user.organization?.name ?? "Club"} ${dailyChallengeAgeGroupLabel(ageGroup)}`
    : `LCB ${dailyChallengeAgeGroupLabel(ageGroup)}`;

  const viewerNotice =
    user.isTestAccount || user.clubReportExcluded
      ? ({ kind: "account_excluded" } as const)
      : user.hideFromLeaderboards
        ? ({ kind: "hidden_setting" } as const)
        : null;

  return {
    scope: orgScoped ? "org" : "overall",
    scopeLabel,
    ageGroup,
    ageGroupLabel: dailyChallengeAgeGroupLabel(ageGroup),
    monthKey: monthPrefix,
    top: withRank.slice(0, 5),
    self: viewerNotice ? null : self,
    totalPlayers: withRank.length,
    viewerNotice,
  };
}

export async function loadMemberDailyChallengeStats(userId: string, now = new Date()) {
  const { dateKey } = getChicagoDateTimeParts(now);
  return loadUserCompletionStats(userId, dateKey);
}

export async function loadOrgChallengeCompletionsByTeam(
  _orgId: string,
  memberIds: string[],
  teamByUserId: Map<string, string | null>,
  now = new Date(),
) {
  const { dateKey } = getChicagoDateTimeParts(now);
  const monthPrefix = chicagoMonthPrefix(dateKey);
  if (memberIds.length === 0) {
    return new Map<string, number>();
  }

  const rows = await prisma.dailyChallengeCompletion.findMany({
    where: {
      userId: { in: memberIds },
      challengeDoneAt: { not: null },
      chicagoDate: { startsWith: monthPrefix },
    },
    select: { userId: true },
  });

  const byTeam = new Map<string, number>();
  for (const row of rows) {
    const teamId = teamByUserId.get(row.userId) ?? null;
    const key = teamId ?? "__no_team__";
    byTeam.set(key, (byTeam.get(key) ?? 0) + 1);
  }
  return byTeam;
}

export type ScheduledDailyChallengePushPreview = {
  channel: "push";
  type: "DAILY_CHALLENGE";
  userId: string;
  title: string;
  body: string;
  url: string;
  dateKey: string;
};

const DAILY_CHALLENGE_PUSH_TITLE = "Daily Challenge";
const DAILY_CHALLENGE_PUSH_BODY = "Your daily challenge is ready.";

export async function runDailyChallengePushJobs(params: {
  dryRun: boolean;
  now: Date;
  dateKey: string;
  hour: number;
  previews: Array<{
    channel: "push";
    type: string;
    userId: string;
    enrollmentId?: string;
    title: string;
    body: string;
    url: string;
    dateKey: string;
  }>;
  trySend: (label: string, fn: () => Promise<boolean>) => Promise<void>;
}) {
  const settings = await getDailyChallengeSettings();
  if (params.hour !== settings.pushHourChicago) {
    return;
  }

  const users = await prisma.user.findMany({
    where: {
      isTestAccount: false,
      pushSubscriptions: { some: {} },
    },
    select: {
      id: true,
      age: true,
      playerAge: true,
    },
  });

  for (const user of users) {
    await params.trySend(`push-daily-challenge:${user.id}`, async () => {
      const hasPush = await userHasPushSubscriptions(user.id);
      if (!hasPush) {
        return false;
      }

      const age = preferredPlayerAge(user.age, user.playerAge);
      const ageGroup = resolveDailyChallengeAgeGroup(age);
      if (!ageGroup) {
        return false;
      }

      const done = await prisma.dailyChallengeCompletion.findUnique({
        where: {
          userId_chicagoDate: { userId: user.id, chicagoDate: params.dateKey },
        },
        select: { challengeDoneAt: true },
      });
      if (done?.challengeDoneAt) {
        return false;
      }

      const challenge = await loadRotationChallenge(ageGroup, params.dateKey);
      if (!challenge) {
        return false;
      }

      const type = "DAILY_CHALLENGE" as const;
      const dedupeKey = buildPushDedupeKey(user.id, type, params.dateKey);
      const title = DAILY_CHALLENGE_PUSH_TITLE;
      const body = DAILY_CHALLENGE_PUSH_BODY;
      const url = "/dashboard";

      params.previews.push({
        channel: "push",
        type,
        userId: user.id,
        title,
        body,
        url,
        dateKey: params.dateKey,
      });

      if (!params.dryRun) {
        await sendPushToUser(user.id, { title, body, url }, { type, dedupeKey });
      }
      return true;
    });
  }
}

export { previousChicagoDateKey };

export type AdminDailyChallengeRow = {
  id: string;
  ageGroup: DailyChallengeAgeGroup;
  rotationDay: number;
  title: string;
  instructions: string;
  drillLibraryVimeoId: string | null;
  active: boolean;
  updatedAt: string;
};

export type AdminDailyQuestionRow = {
  id: string;
  ageGroup: DailyChallengeAgeGroup | null;
  rotationDay: number;
  type: DailyQuestionType;
  prompt: string;
  options: string[];
  correctOptionIndex: number | null;
  explanation: string | null;
  active: boolean;
  updatedAt: string;
};

export async function listAdminDailyChallenges() {
  const rows = await prisma.dailyChallenge.findMany({
    orderBy: [{ ageGroup: "asc" }, { rotationDay: "asc" }],
  });
  return rows.map(
    (row): AdminDailyChallengeRow => ({
      id: row.id,
      ageGroup: row.ageGroup,
      rotationDay: row.rotationDay,
      title: row.title,
      instructions: row.instructions,
      drillLibraryVimeoId: row.drillLibraryVimeoId,
      active: row.active,
      updatedAt: row.updatedAt.toISOString(),
    }),
  );
}

export async function listAdminDailyQuestions() {
  const rows = await prisma.dailyQuestion.findMany({
    orderBy: [{ type: "asc" }, { ageGroup: "asc" }, { rotationDay: "asc" }],
  });
  return rows.map(
    (row): AdminDailyQuestionRow => ({
      id: row.id,
      ageGroup: row.ageGroup,
      rotationDay: row.rotationDay,
      type: row.type,
      prompt: row.prompt,
      options: row.options,
      correctOptionIndex: row.correctOptionIndex,
      explanation: row.explanation,
      active: row.active,
      updatedAt: row.updatedAt.toISOString(),
    }),
  );
}

export async function upsertAdminDailyChallenge(input: {
  id?: string;
  ageGroup: DailyChallengeAgeGroup;
  rotationDay: number;
  title: string;
  instructions: string;
  drillLibraryVimeoId?: string | null;
  active?: boolean;
}) {
  if (!Number.isInteger(input.rotationDay) || input.rotationDay < 1) {
    return { ok: false as const, error: "rotationDay must be an integer >= 1." };
  }
  const title = input.title.trim();
  const instructions = input.instructions.trim();
  if (!title || !instructions) {
    return { ok: false as const, error: "Title and instructions are required." };
  }
  const drillLibraryVimeoId = input.drillLibraryVimeoId?.trim() || null;

  if (input.id) {
    const row = await prisma.dailyChallenge.update({
      where: { id: input.id },
      data: {
        ageGroup: input.ageGroup,
        rotationDay: input.rotationDay,
        title,
        instructions,
        drillLibraryVimeoId,
        active: input.active ?? true,
      },
    });
    return { ok: true as const, row };
  }

  const row = await prisma.dailyChallenge.upsert({
    where: {
      ageGroup_rotationDay: {
        ageGroup: input.ageGroup,
        rotationDay: input.rotationDay,
      },
    },
    create: {
      ageGroup: input.ageGroup,
      rotationDay: input.rotationDay,
      title,
      instructions,
      drillLibraryVimeoId,
      active: input.active ?? true,
    },
    update: {
      title,
      instructions,
      drillLibraryVimeoId,
      active: input.active ?? true,
    },
  });
  return { ok: true as const, row };
}

export async function upsertAdminDailyQuestion(input: {
  id?: string;
  ageGroup: DailyChallengeAgeGroup | null;
  rotationDay: number;
  type: DailyQuestionType;
  prompt: string;
  options?: string[];
  correctOptionIndex?: number | null;
  explanation?: string | null;
  active?: boolean;
}) {
  if (!Number.isInteger(input.rotationDay) || input.rotationDay < 1) {
    return { ok: false as const, error: "rotationDay must be an integer >= 1." };
  }
  const prompt = input.prompt.trim();
  if (!prompt) {
    return { ok: false as const, error: "Prompt is required." };
  }

  const options =
    input.type === "TRIVIA"
      ? (input.options ?? []).map((option) => option.trim()).filter(Boolean)
      : [];
  if (input.type === "TRIVIA") {
    if (options.length < 2 || options.length > 4) {
      return { ok: false as const, error: "Trivia needs 2-4 options." };
    }
    if (
      input.correctOptionIndex === null ||
      input.correctOptionIndex === undefined ||
      !Number.isInteger(input.correctOptionIndex) ||
      input.correctOptionIndex < 0 ||
      input.correctOptionIndex >= options.length
    ) {
      return { ok: false as const, error: "Pick a valid correct option index." };
    }
  }

  const data = {
    ageGroup: input.ageGroup,
    rotationDay: input.rotationDay,
    type: input.type,
    prompt,
    options,
    correctOptionIndex: input.type === "TRIVIA" ? input.correctOptionIndex ?? null : null,
    explanation: input.type === "TRIVIA" ? input.explanation?.trim() || null : null,
    active: input.active ?? true,
  };

  if (input.id) {
    const row = await prisma.dailyQuestion.update({
      where: { id: input.id },
      data,
    });
    return { ok: true as const, row };
  }

  const existing = await prisma.dailyQuestion.findFirst({
    where: {
      type: input.type,
      ageGroup: input.ageGroup,
      rotationDay: input.rotationDay,
    },
  });
  const row = existing
    ? await prisma.dailyQuestion.update({ where: { id: existing.id }, data })
    : await prisma.dailyQuestion.create({ data });
  return { ok: true as const, row };
}

export async function deleteAdminDailyChallenge(id: string) {
  await prisma.dailyChallenge.delete({ where: { id } });
}

export async function deleteAdminDailyQuestion(id: string) {
  await prisma.dailyQuestion.delete({ where: { id } });
}
