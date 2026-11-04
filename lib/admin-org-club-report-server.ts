import "server-only";

import {
  addChicagoCalendarDays,
  getChicagoTodayDateKey,
} from "@/lib/program-schedule";
import { getChicagoDayStart } from "@/lib/program-email-chicago";
import { formatDateWithYear } from "@/lib/format-date";
import {
  buildClubReportLevelCounts,
  CLUB_REPORT_NO_TEAM_KEY,
  CLUB_REPORT_NO_TEAM_LABEL,
  filterClubReportMembers,
  memberSignupInstant,
  sortClubReportTeams,
  type ClubReportMemberInput,
  type ClubReportPayload,
  type ClubReportSignupPoint,
  type ClubReportTeamRow,
} from "@/lib/club-report-shared";
import {
  formatChicagoMonthDayLabel,
  formatChicagoTrialEndLabel,
} from "@/lib/org-trial-dates-shared";
import { getWeekStartMondayChicago } from "@/lib/org-weekly-focus-shared";
import { prisma } from "@/lib/prisma";

const ACTIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function shortChicagoDayLabel(dateKey: string) {
  const date = getChicagoDayStart(dateKey);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "numeric",
    day: "numeric",
  }).format(date);
}

function buildSignupSeries(
  members: ClubReportMemberInput[],
  seriesStart: Date,
  endDateKey: string,
): ClubReportSignupPoint[] {
  const startKey = getChicagoTodayDateKey(seriesStart);
  const keys: string[] = [];
  let cursor = startKey;
  while (cursor <= endDateKey) {
    keys.push(cursor);
    cursor = addChicagoCalendarDays(cursor, 1);
  }

  const counts = new Map<string, number>();
  for (const key of keys) {
    counts.set(key, 0);
  }

  for (const member of members) {
    const key = getChicagoTodayDateKey(memberSignupInstant(member));
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return keys.map((dateKey) => ({
    dateKey,
    shortLabel: shortChicagoDayLabel(dateKey),
    count: counts.get(dateKey) ?? 0,
  }));
}

async function loadActiveMemberIds(userIds: string[], since: Date): Promise<Set<string>> {
  const active = new Set<string>();
  if (userIds.length === 0) {
    return active;
  }

  const [
    swingCreated,
    swingResponded,
    mentalCreated,
    mentalResponded,
    goalCheckins,
    playbookProgress,
    playbookChapters,
    taskCompletions,
    quizAttempts,
  ] = await Promise.all([
    prisma.swingAnalysisSubmission.findMany({
      where: { userId: { in: userIds }, createdAt: { gte: since } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.swingAnalysisSubmission.findMany({
      where: { userId: { in: userIds }, respondedAt: { gte: since } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.mentalGameSubmission.findMany({
      where: { userId: { in: userIds }, createdAt: { gte: since } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.mentalGameSubmission.findMany({
      where: { userId: { in: userIds }, respondedAt: { gte: since } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.goalCheckin.findMany({
      where: { userId: { in: userIds }, createdAt: { gte: since } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.playbookProgress.findMany({
      where: { userId: { in: userIds }, updatedAt: { gte: since } },
      select: { userId: true },
    }),
    prisma.playbookChapter.findMany({
      where: {
        completedAt: { gte: since },
        progress: { userId: { in: userIds } },
      },
      select: { progress: { select: { userId: true } } },
    }),
    prisma.taskCompletion.findMany({
      where: {
        completedAt: { gte: since },
        enrollment: { userId: { in: userIds } },
      },
      select: { enrollment: { select: { userId: true } } },
      distinct: ["enrollmentId"],
    }),
    prisma.quizAttempt.findMany({
      where: {
        userId: { in: userIds },
        OR: [{ completedAt: { gte: since } }, { createdAt: { gte: since } }],
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);

  for (const row of swingCreated) {
    active.add(row.userId);
  }
  for (const row of swingResponded) {
    active.add(row.userId);
  }
  for (const row of mentalCreated) {
    active.add(row.userId);
  }
  for (const row of mentalResponded) {
    active.add(row.userId);
  }
  for (const row of goalCheckins) {
    active.add(row.userId);
  }
  for (const row of playbookProgress) {
    active.add(row.userId);
  }
  for (const row of playbookChapters) {
    active.add(row.progress.userId);
  }
  for (const row of taskCompletions) {
    active.add(row.enrollment.userId);
  }
  for (const row of quizAttempts) {
    if (row.userId) {
      active.add(row.userId);
    }
  }

  return active;
}

function buildTeamRows(params: {
  members: ClubReportMemberInput[];
  activeMemberIds: Set<string>;
  completedReportsByUserId: Map<string, number>;
  teamNames: Map<string, string>;
}): ClubReportTeamRow[] {
  const buckets = new Map<
    string,
    { signUps: number; activeLast7Days: number; reportsCompleted: number; teamName: string }
  >();

  for (const member of params.members) {
    const teamKey = member.orgTeamId ?? CLUB_REPORT_NO_TEAM_KEY;
    const teamName =
      teamKey === CLUB_REPORT_NO_TEAM_KEY
        ? CLUB_REPORT_NO_TEAM_LABEL
        : (params.teamNames.get(teamKey) ?? "Team");

    const current = buckets.get(teamKey) ?? {
      signUps: 0,
      activeLast7Days: 0,
      reportsCompleted: 0,
      teamName,
    };
    current.signUps += 1;
    if (params.activeMemberIds.has(member.id)) {
      current.activeLast7Days += 1;
    }
    current.reportsCompleted += params.completedReportsByUserId.get(member.id) ?? 0;
    buckets.set(teamKey, current);
  }

  return sortClubReportTeams(
    [...buckets.entries()].map(([teamKey, row]) => ({
      teamKey,
      teamName: row.teamName,
      signUps: row.signUps,
      activeLast7Days: row.activeLast7Days,
      reportsCompleted: row.reportsCompleted,
    })),
  );
}

export async function loadAdminOrgClubReport(
  orgId: string,
  now = new Date(),
): Promise<ClubReportPayload | null> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      trialStartsAt: true,
      trialEndsAt: true,
      teams: { select: { id: true, name: true } },
    },
  });

  if (!org) {
    return null;
  }

  const rawMembers = await prisma.user.findMany({
    where: { organizationId: orgId },
    select: {
      id: true,
      orgTeamId: true,
      signupDate: true,
      orgJoinedAt: true,
      isTestAccount: true,
      clubReportExcluded: true,
      membershipTier: true,
      membershipLevel: true,
      membershipLevelExpiresAt: true,
      playbookLegacyAccess: true,
      organizationId: true,
      orgTrialQuickReportUsed: true,
      coreQuickReportNextEligibleAt: true,
      organization: {
        select: {
          active: true,
          billingMode: true,
          coveredLevel: true,
          trialStartsAt: true,
          trialEndsAt: true,
        },
      },
    },
  });

  const members = filterClubReportMembers(rawMembers as ClubReportMemberInput[]);
  const memberIds = members.map((member) => member.id);
  const since = new Date(now.getTime() - ACTIVE_WINDOW_MS);
  const weekStart = getWeekStartMondayChicago(now);

  const [activeMemberIds, weeklyFocusWeeks, teamNames] = await Promise.all([
    loadActiveMemberIds(memberIds, since),
    prisma.orgWeeklyFocus.findMany({
      where: {
        organizationId: orgId,
        ...(org.trialStartsAt
          ? { weekStartDate: { gte: org.trialStartsAt } }
          : {}),
      },
      select: { weekStartDate: true },
      distinct: ["weekStartDate"],
    }),
    Promise.resolve(new Map(org.teams.map((team) => [team.id, team.name]))),
  ]);

  const swingRows =
    memberIds.length === 0
      ? []
      : await prisma.swingAnalysisSubmission.findMany({
          where: { userId: { in: memberIds } },
          select: { userId: true, respondedAt: true },
        });

  let swingReportsRequested = swingRows.length;
  let swingReportsCompleted = 0;
  const completedReportsByUserId = new Map<string, number>();
  for (const row of swingRows) {
    if (row.respondedAt) {
      swingReportsCompleted += 1;
      completedReportsByUserId.set(row.userId, (completedReportsByUserId.get(row.userId) ?? 0) + 1);
    }
  }

  const signUpsThisWeek = members.filter(
    (member) => memberSignupInstant(member) >= weekStart,
  ).length;

  const seriesStart =
    org.trialStartsAt ??
    (members.length > 0
      ? new Date(
          Math.min(...members.map((member) => memberSignupInstant(member).getTime())),
        )
      : now);

  const endDateKey = getChicagoTodayDateKey(now);
  const signUpsByDay = buildSignupSeries(members, seriesStart, endDateKey);
  const { counts: levelCounts, showLevelBreakdown } = buildClubReportLevelCounts(members, now);

  const teams = buildTeamRows({
    members,
    activeMemberIds,
    completedReportsByUserId,
    teamNames,
  });

  const todayChicago = getChicagoDayStart(endDateKey);

  return {
    orgId: org.id,
    orgName: org.name,
    logoUrl: org.logoUrl,
    trialStartsLabel: formatChicagoMonthDayLabel(org.trialStartsAt),
    trialEndsLabel: formatChicagoTrialEndLabel(org.trialEndsAt),
    reportDateLabel: formatDateWithYear(todayChicago),
    totals: {
      totalSignUps: members.length,
      signUpsThisWeek,
      activeLast7Days: [...activeMemberIds].filter((id) => memberIds.includes(id)).length,
      swingReportsRequested,
      swingReportsCompleted,
      weeklyFocusWeeksPublished: weeklyFocusWeeks.length,
    },
    teams,
    signUpsByDay,
    showLevelBreakdown,
    levelCounts,
  };
}

export async function updateMemberClubReportExcluded(params: {
  userId: string;
  excluded: boolean;
}) {
  await prisma.user.update({
    where: { id: params.userId },
    data: { clubReportExcluded: params.excluded },
  });
}
