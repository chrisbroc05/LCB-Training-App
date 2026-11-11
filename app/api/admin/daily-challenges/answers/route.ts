import type { DailyChallengeAgeGroup } from "@prisma/client";
import { requireAdminApiSession } from "@/lib/admin-api-auth";
import { jsonNoStore } from "@/lib/api-no-store";
import { isDailyChallengeAgeGroup } from "@/lib/daily-challenge-shared";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const dateKey = url.searchParams.get("date")?.trim() ?? "";
  const organizationId = url.searchParams.get("organizationId")?.trim() || null;
  const orgTeamId = url.searchParams.get("orgTeamId")?.trim() || null;
  const ageGroupRaw = url.searchParams.get("ageGroup")?.trim() || null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return jsonNoStore({ error: "date must be YYYY-MM-DD." }, { status: 400 });
  }

  let ageGroup: DailyChallengeAgeGroup | undefined;
  if (ageGroupRaw) {
    if (!isDailyChallengeAgeGroup(ageGroupRaw)) {
      return jsonNoStore({ error: "Invalid age group." }, { status: 400 });
    }
    ageGroup = ageGroupRaw as DailyChallengeAgeGroup;
  }

  const rows = await prisma.dailyChallengeCompletion.findMany({
    where: {
      chicagoDate: dateKey,
      mindsetAnswer: { not: null },
      ...(ageGroup ? { ageGroup } : {}),
      user: {
        ...(organizationId ? { organizationId } : {}),
        ...(orgTeamId ? { orgTeamId } : {}),
        isTestAccount: false,
      },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      chicagoDate: true,
      ageGroup: true,
      mindsetAnswer: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          playerFirstName: true,
          playerLastName: true,
          name: true,
          email: true,
          organization: { select: { id: true, name: true } },
          orgTeam: { select: { id: true, name: true } },
        },
      },
      question: {
        select: { id: true, prompt: true },
      },
    },
    take: 500,
  });

  return jsonNoStore({
    answers: rows.map((row) => ({
      id: row.id,
      chicagoDate: row.chicagoDate,
      ageGroup: row.ageGroup,
      mindsetAnswer: row.mindsetAnswer,
      updatedAt: row.updatedAt.toISOString(),
      prompt: row.question?.prompt ?? null,
      user: {
        id: row.user.id,
        name:
          [row.user.playerFirstName, row.user.playerLastName].filter(Boolean).join(" ") ||
          row.user.name ||
          row.user.email,
        email: row.user.email,
        organizationName: row.user.organization?.name ?? null,
        teamName: row.user.orgTeam?.name ?? null,
      },
    })),
  });
}
