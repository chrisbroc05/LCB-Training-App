import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jsonNoStore } from "@/lib/api-no-store";
import { loadDailyLeaderboardForUser } from "@/lib/daily-challenge-server";
import { prisma } from "@/lib/prisma";
import {
  chicagoMonthPrefix,
  computeCurrentStreak,
  dailyChallengeAgeGroupLabel,
  formatLeaderboardDisplayName,
  preferredPlayerAge,
  resolveDailyChallengeAgeGroup,
  type DailyChallengeAgeGroupKey,
} from "@/lib/daily-challenge-shared";
import { getChicagoDateTimeParts } from "@/lib/program-email-chicago";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await loadDailyLeaderboardForUser(session.user.id);
  if (!summary) {
    return jsonNoStore({ error: "Set your age to see the leaderboard." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      organizationId: true,
      age: true,
      playerAge: true,
    },
  });
  if (!user) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  const ageGroup = resolveDailyChallengeAgeGroup(
    preferredPlayerAge(user.age, user.playerAge),
  ) as DailyChallengeAgeGroupKey;
  const { dateKey } = getChicagoDateTimeParts();
  const monthPrefix = chicagoMonthPrefix(dateKey);
  const orgScoped = Boolean(user.organizationId);

  const eligibleUsers = await prisma.user.findMany({
    where: {
      isTestAccount: false,
      clubReportExcluded: false,
      hideFromLeaderboards: false,
      ...(orgScoped ? { organizationId: user.organizationId } : {}),
    },
    select: {
      id: true,
      playerFirstName: true,
      playerLastName: true,
      name: true,
      age: true,
      playerAge: true,
      orgTeam: { select: { name: true } },
    },
  });

  const ageFiltered = eligibleUsers.filter(
    (row) =>
      resolveDailyChallengeAgeGroup(preferredPlayerAge(row.age, row.playerAge)) === ageGroup,
  );
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
      return {
        userId: row.id,
        displayName: formatLeaderboardDisplayName({
          firstName: row.playerFirstName,
          lastName: row.playerLastName,
          fallbackName: row.name,
          teamName: orgScoped ? row.orgTeam?.name ?? null : null,
        }),
        completedThisMonth: dates.filter((key) => key.startsWith(monthPrefix)).length,
        streak: computeCurrentStreak(dates, dateKey),
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
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      isSelf: row.userId === session.user.id,
    }));

  return jsonNoStore({
    summary: {
      ...summary,
      ageGroupLabel: dailyChallengeAgeGroupLabel(ageGroup),
    },
    entries: ranked,
  });
}
