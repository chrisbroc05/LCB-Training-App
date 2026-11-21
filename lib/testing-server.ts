import "server-only";

import type { Prisma, TestBetterIs, TestSession } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createOrFindOnUniqueViolation } from "@/lib/prisma-get-or-create-shared";
import { PROGRAM_AGE_GROUP_LABELS } from "@/lib/program-enrollment-shared";
import { normalizeTeamSlug } from "@/lib/waiver-sign-shared";
import {
  buildClaimCode,
  buildPlayerDisplayName,
  computeBestAttempt,
  formatTestSessionDateKey,
  normalizePersonName,
  normalizeTestSessionDateKey,
  splitPlayerName,
  testSessionDateValue,
  MAX_TEST_ATTEMPTS,
  type CsvImportPreview,
  type TestMetricRecord,
  type TestPlayerSummary,
  type TestResultRecord,
  type TestSessionSummary,
  type TestStationRecord,
  type TestTeamOption,
  type TestTeamSummary,
} from "@/lib/testing-shared";

export type WaiverRosterSyncResult = {
  created: number;
  updated: number;
  totalWaivers: number;
};

function serializeMetric(metric: {
  key: string;
  label: string;
  unit: string;
  decimals: number;
  betterIs: TestBetterIs;
  category: string;
  active: boolean;
  sortOrder: number;
  inputType: string;
}): TestMetricRecord {
  return {
    key: metric.key,
    label: metric.label,
    unit: metric.unit,
    decimals: metric.decimals,
    betterIs: metric.betterIs,
    category: metric.category,
    active: metric.active,
    sortOrder: metric.sortOrder,
    inputType: metric.inputType === "feet_inches" ? "feet_inches" : "number",
  };
}

function serializePlayer(player: {
  id: string;
  firstName: string;
  lastName: string;
  birthYear: number | null;
  age: number | null;
  positions: string[];
  bats: string | null;
  throws: string | null;
  parentEmail: string | null;
  claimCode: string;
  userId: string | null;
  waiverSignatureId: string | null;
  createdAt: Date;
}): TestPlayerSummary {
  return {
    id: player.id,
    firstName: player.firstName,
    lastName: player.lastName,
    birthYear: player.birthYear,
    age: player.age,
    positions: player.positions,
    bats: player.bats,
    throws: player.throws,
    parentEmail: player.parentEmail,
    claimCode: player.claimCode,
    userId: player.userId,
    waiverSignatureId: player.waiverSignatureId,
    createdAt: player.createdAt.toISOString(),
  };
}

function serializeResult(result: {
  id: string;
  sessionId: string;
  playerId: string;
  metricKey: string;
  attempts: number[];
  best: number | null;
  absent: boolean;
  skipped: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TestResultRecord {
  return {
    id: result.id,
    sessionId: result.sessionId,
    playerId: result.playerId,
    metricKey: result.metricKey,
    attempts: result.attempts,
    best: result.best,
    absent: result.absent,
    skipped: result.skipped,
    notes: result.notes,
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
  };
}

async function findMatchingWaiverSignature(params: {
  firstName: string;
  lastName: string;
  teamSlug: string;
}) {
  const normalizedName = normalizePersonName(
    buildPlayerDisplayName(params.firstName, params.lastName),
  );

  const candidates = await prisma.waiverSignature.findMany({
    where: { teamSlug: params.teamSlug },
    orderBy: { signedAt: "desc" },
    take: 200,
  });

  return (
    candidates.find((signature) => {
      const signatureName = normalizePersonName(
        buildPlayerDisplayName(signature.playerFirstName, signature.playerLastName),
      );
      return signatureName === normalizedName;
    }) ?? null
  );
}

function serializeStation(station: {
  key: string;
  label: string;
  sortOrder: number;
  active: boolean;
  metricKeys: string[];
}): TestStationRecord {
  return {
    key: station.key,
    label: station.label,
    sortOrder: station.sortOrder,
    active: station.active,
    metricKeys: station.metricKeys,
  };
}

export async function ensureTestTeamBySlug(teamSlug: string, name: string) {
  const existing = await prisma.testTeam.findUnique({ where: { teamSlug } });
  if (existing) {
    return existing;
  }
  return prisma.testTeam.create({
    data: {
      name: name.trim(),
      teamSlug,
    },
  });
}

export async function listTestingTeamOptions(): Promise<TestTeamOption[]> {
  const waivers = await prisma.waiverSignature.findMany({
    where: { teamSlug: { not: null } },
    select: { teamSlug: true, teamName: true },
    orderBy: { signedAt: "desc" },
  });

  const nameBySlug = new Map<string, string>();
  for (const waiver of waivers) {
    if (waiver.teamSlug && !nameBySlug.has(waiver.teamSlug)) {
      nameBySlug.set(waiver.teamSlug, waiver.teamName ?? waiver.teamSlug);
    }
  }

  const teams = await prisma.testTeam.findMany({
    where: { archived: false },
    select: { id: true, name: true, teamSlug: true },
  });

  for (const team of teams) {
    if (!nameBySlug.has(team.teamSlug)) {
      nameBySlug.set(team.teamSlug, team.name);
    }
  }

  const teamIdBySlug = new Map(teams.map((team) => [team.teamSlug, team.id]));

  return Array.from(nameBySlug.entries())
    .map(([slug, label]) => ({
      teamSlug: slug,
      name: label,
      teamId: teamIdBySlug.get(slug) ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function generateUniqueClaimCode(teamName: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const claimCode = buildClaimCode(teamName);
    const existing = await prisma.testPlayer.findUnique({ where: { claimCode } });
    if (!existing) {
      return claimCode;
    }
  }
  throw new Error("Unable to generate a unique claim code.");
}

async function ensurePlayerOnTeam(teamId: string, playerId: string) {
  await prisma.testTeamPlayer.upsert({
    where: { teamId_playerId: { teamId, playerId } },
    create: { teamId, playerId },
    update: {},
  });
}

async function upsertPlayerFromWaiver(
  teamId: string,
  teamName: string,
  waiver: {
    id: string;
    playerFirstName: string;
    playerLastName: string;
    playerAge: number;
    signerEmail: string;
  },
): Promise<"created" | "updated"> {
  const parentEmail = waiver.signerEmail.trim() || null;

  const linkedPlayer = await prisma.testPlayer.findFirst({
    where: { waiverSignatureId: waiver.id },
  });

  if (linkedPlayer) {
    await prisma.testPlayer.update({
      where: { id: linkedPlayer.id },
      data: {
        firstName: waiver.playerFirstName.trim(),
        lastName: waiver.playerLastName.trim(),
        age: waiver.playerAge,
        parentEmail,
        waiverSignatureId: waiver.id,
      },
    });
    await ensurePlayerOnTeam(teamId, linkedPlayer.id);
    return "updated";
  }

  const roster = await prisma.testTeamPlayer.findMany({
    where: { teamId },
    include: { player: true },
  });

  const normalizedWaiverName = normalizePersonName(
    buildPlayerDisplayName(waiver.playerFirstName, waiver.playerLastName),
  );

  const nameMatch = roster.find((entry) => {
    const rosterName = normalizePersonName(
      buildPlayerDisplayName(entry.player.firstName, entry.player.lastName),
    );
    if (rosterName !== normalizedWaiverName) {
      return false;
    }
    return (
      entry.player.waiverSignatureId === null || entry.player.waiverSignatureId === waiver.id
    );
  });

  if (nameMatch) {
    await prisma.testPlayer.update({
      where: { id: nameMatch.player.id },
      data: {
        firstName: waiver.playerFirstName.trim(),
        lastName: waiver.playerLastName.trim(),
        age: waiver.playerAge,
        parentEmail,
        waiverSignatureId: waiver.id,
      },
    });
    return "updated";
  }

  const claimCode = await generateUniqueClaimCode(teamName);
  await prisma.testPlayer.create({
    data: {
      firstName: waiver.playerFirstName.trim(),
      lastName: waiver.playerLastName.trim(),
      age: waiver.playerAge,
      parentEmail,
      claimCode,
      waiverSignatureId: waiver.id,
      teams: { create: { teamId } },
    },
  });
  return "created";
}

export async function syncTestTeamRosterFromWaivers(teamId: string): Promise<WaiverRosterSyncResult> {
  const team = await prisma.testTeam.findUnique({ where: { id: teamId } });
  if (!team) {
    throw new Error("Team not found.");
  }

  const waivers = await prisma.waiverSignature.findMany({
    where: { teamSlug: team.teamSlug },
    orderBy: { signedAt: "asc" },
  });

  let created = 0;
  let updated = 0;

  for (const waiver of waivers) {
    const outcome = await upsertPlayerFromWaiver(teamId, team.name, waiver);
    if (outcome === "created") {
      created += 1;
    } else {
      updated += 1;
    }
  }

  return { created, updated, totalWaivers: waivers.length };
}

export async function syncTestingRosterForWaiverTeamSlug(teamSlug: string | null | undefined) {
  if (!teamSlug) {
    return;
  }

  const waiverSample = await prisma.waiverSignature.findFirst({
    where: { teamSlug },
    select: { teamName: true },
    orderBy: { signedAt: "desc" },
  });

  const team = await ensureTestTeamBySlug(teamSlug, waiverSample?.teamName ?? teamSlug);
  await syncTestTeamRosterFromWaivers(team.id);
}

export async function listTestTeams(includeArchived = false) {
  const teams = await prisma.testTeam.findMany({
    where: includeArchived ? undefined : { archived: false },
    orderBy: [{ archived: "asc" }, { createdAt: "desc" }],
    include: {
      roster: true,
      sessions: {
        orderBy: { date: "desc" },
        take: 1,
      },
    },
  });

  return teams.map((team): TestTeamSummary => ({
    id: team.id,
    name: team.name,
    teamSlug: team.teamSlug,
    season: team.season,
    coachName: team.coachName,
    coachEmail: team.coachEmail,
    archived: team.archived,
    createdAt: team.createdAt.toISOString(),
    playerCount: team.roster.length,
    lastSessionDate: team.sessions[0]
      ? formatTestSessionDateKey(team.sessions[0].date)
      : null,
    lastSessionLabel: team.sessions[0]?.label ?? null,
  }));
}

export async function createTestTeam(input: { name: string }) {
  const name = input.name.trim();
  const teamSlug = normalizeTeamSlug(name);
  const existing = await prisma.testTeam.findUnique({ where: { teamSlug } });
  if (existing) {
    return existing;
  }
  return prisma.testTeam.create({
    data: { name, teamSlug },
  });
}

export async function updateTestTeam(
  teamId: string,
  input: Partial<{
    name: string;
    season: string;
    coachName: string;
    coachEmail: string | null;
    archived: boolean;
  }>,
) {
  return prisma.testTeam.update({
    where: { id: teamId },
    data: {
      name: input.name?.trim(),
      season: input.season?.trim(),
      coachName: input.coachName?.trim(),
      coachEmail: input.coachEmail === undefined ? undefined : input.coachEmail?.trim() || null,
      archived: input.archived,
    },
  });
}

export async function getTestTeamDetail(teamId: string) {
  const team = await prisma.testTeam.findUnique({
    where: { id: teamId },
    include: {
      roster: {
        include: { player: true },
        orderBy: { player: { lastName: "asc" } },
      },
      sessions: {
        orderBy: { date: "desc" },
        include: {
          _count: { select: { results: true } },
        },
      },
    },
  });
  if (!team) {
    return null;
  }

  return {
    team: {
      id: team.id,
      name: team.name,
      teamSlug: team.teamSlug,
      season: team.season,
      coachName: team.coachName,
      coachEmail: team.coachEmail,
      archived: team.archived,
      createdAt: team.createdAt.toISOString(),
    },
    players: team.roster.map((entry) => serializePlayer(entry.player)),
    sessions: team.sessions.map(
      (session): TestSessionSummary => ({
        id: session.id,
        teamId: session.teamId,
        date: formatTestSessionDateKey(session.date),
        label: session.label,
        notes: session.notes,
        resultCount: session._count.results,
      }),
    ),
  };
}

export async function createTestPlayer(input: {
  firstName: string;
  lastName: string;
  age?: number | null;
  birthYear?: number | null;
  positions?: string[];
  bats?: string | null;
  throws?: string | null;
  parentEmail?: string | null;
  userId?: string | null;
  teamId?: string | null;
  claimCodeSeed?: string;
}) {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  if (!firstName || !lastName) {
    throw new Error("First and last name are required.");
  }

  let team: { id: string; name: string; teamSlug: string } | null = null;
  if (input.teamId) {
    team = await prisma.testTeam.findUnique({ where: { id: input.teamId } });
    if (!team) {
      throw new Error("Team not found.");
    }
  }

  if (input.userId) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true },
    });
    if (!user) {
      throw new Error("App account not found.");
    }
    const alreadyLinked = await prisma.testPlayer.findFirst({
      where: { userId: input.userId },
      select: { id: true },
    });
    if (alreadyLinked) {
      throw new Error("That app account is already linked to another testing player.");
    }
  }

  const claimSeed = input.claimCodeSeed?.trim() || team?.name || `${firstName} ${lastName}`;
  const claimCode = await generateUniqueClaimCode(claimSeed);
  const waiver = team
    ? await findMatchingWaiverSignature({
        firstName,
        lastName,
        teamSlug: team.teamSlug,
      })
    : null;

  const player = await prisma.testPlayer.create({
    data: {
      firstName,
      lastName,
      age: input.age ?? null,
      birthYear: input.birthYear ?? null,
      positions: input.positions ?? [],
      bats: input.bats?.trim() || null,
      throws: input.throws?.trim() || null,
      parentEmail: input.parentEmail?.trim() || waiver?.signerEmail.trim() || null,
      claimCode,
      userId: input.userId ?? null,
      waiverSignatureId: waiver?.id ?? null,
      ...(team ? { teams: { create: { teamId: team.id } } } : {}),
    },
  });

  return serializePlayer(player);
}

export async function addPlayerToTeam(
  teamId: string,
  input: {
    firstName: string;
    lastName: string;
    age?: number | null;
    birthYear?: number | null;
    positions?: string[];
    bats?: string | null;
    throws?: string | null;
    parentEmail?: string | null;
    userId?: string | null;
  },
) {
  return createTestPlayer({ ...input, teamId });
}

export async function addExistingPlayerToTeam(teamId: string, playerId: string) {
  const team = await prisma.testTeam.findUnique({ where: { id: teamId } });
  if (!team) {
    throw new Error("Team not found.");
  }
  const player = await prisma.testPlayer.findUnique({ where: { id: playerId } });
  if (!player) {
    throw new Error("Player not found.");
  }
  await ensurePlayerOnTeam(teamId, playerId);
  return serializePlayer(player);
}

export async function updateTestPlayer(
  playerId: string,
  input: Partial<{
    firstName: string;
    lastName: string;
    age: number | null;
    birthYear: number | null;
    positions: string[];
    bats: string | null;
    throws: string | null;
    parentEmail: string | null;
    userId: string | null;
  }>,
) {
  if (input.userId) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true },
    });
    if (!user) {
      throw new Error("App account not found.");
    }
    const alreadyLinked = await prisma.testPlayer.findFirst({
      where: { userId: input.userId, id: { not: playerId } },
      select: { id: true },
    });
    if (alreadyLinked) {
      throw new Error("That app account is already linked to another testing player.");
    }
  }

  const player = await prisma.testPlayer.update({
    where: { id: playerId },
    data: {
      firstName: input.firstName?.trim(),
      lastName: input.lastName?.trim(),
      age: input.age,
      birthYear: input.birthYear,
      positions: input.positions,
      bats: input.bats === undefined ? undefined : input.bats?.trim() || null,
      throws: input.throws === undefined ? undefined : input.throws?.trim() || null,
      parentEmail:
        input.parentEmail === undefined ? undefined : input.parentEmail?.trim() || null,
      userId: input.userId === undefined ? undefined : input.userId,
    },
  });
  return serializePlayer(player);
}

export async function searchTestingUsers(query: string, limit = 8) {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [] as Array<{
      id: string;
      name: string | null;
      email: string;
      playerFirstName: string | null;
      playerLastName: string | null;
      age: number | null;
      playerAge: number | null;
      ageGroupLabel: string | null;
    }>;
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  const orFilters: Prisma.UserWhereInput[] = [
    { email: { contains: trimmed, mode: "insensitive" } },
    { name: { contains: trimmed, mode: "insensitive" } },
    { playerFirstName: { contains: trimmed, mode: "insensitive" } },
    { playerLastName: { contains: trimmed, mode: "insensitive" } },
  ];
  if (parts.length >= 2) {
    orFilters.push({
      AND: [
        { playerFirstName: { contains: parts[0], mode: "insensitive" } },
        { playerLastName: { contains: parts.slice(-1)[0], mode: "insensitive" } },
      ],
    });
  }

  const users = await prisma.user.findMany({
    where: { OR: orFilters },
    select: {
      id: true,
      name: true,
      email: true,
      playerFirstName: true,
      playerLastName: true,
      age: true,
      playerAge: true,
      programEnrollment: { select: { ageGroup: true } },
    },
    take: limit,
    orderBy: [{ playerLastName: "asc" }, { email: "asc" }],
  });

  return users.map((user) => {
    const enrollmentAgeGroup = user.programEnrollment?.ageGroup ?? null;
    const ageGroupLabel = enrollmentAgeGroup
      ? PROGRAM_AGE_GROUP_LABELS[enrollmentAgeGroup]
      : user.playerAge != null
        ? `Age ${user.playerAge}`
        : user.age != null
          ? `Age ${user.age}`
          : null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      playerFirstName: user.playerFirstName,
      playerLastName: user.playerLastName,
      age: user.age,
      playerAge: user.playerAge,
      ageGroupLabel,
    };
  });
}

export async function searchTestPlayers(query: string, limit = 12) {
  const trimmed = query.trim();
  if (trimmed.length < 1) {
    return [] as TestPlayerSummary[];
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  const players = await prisma.testPlayer.findMany({
    where:
      parts.length >= 2
        ? {
            AND: [
              { firstName: { contains: parts[0], mode: "insensitive" } },
              { lastName: { contains: parts.slice(-1)[0], mode: "insensitive" } },
            ],
          }
        : {
            OR: [
              { firstName: { contains: trimmed, mode: "insensitive" } },
              { lastName: { contains: trimmed, mode: "insensitive" } },
              { parentEmail: { contains: trimmed, mode: "insensitive" } },
              { claimCode: { contains: trimmed, mode: "insensitive" } },
            ],
          },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: limit,
  });
  return players.map(serializePlayer);
}

type SessionWithResultCount = TestSession & { _count: { results: number } };

function serializeSessionSummary(session: SessionWithResultCount): TestSessionSummary {
  return {
    id: session.id,
    teamId: session.teamId,
    date: formatTestSessionDateKey(session.date),
    label: session.label,
    notes: session.notes,
    resultCount: session._count.results,
  };
}

async function findSessionForTeamDate(
  teamId: string | null,
  dateValue: Date,
): Promise<SessionWithResultCount | null> {
  return prisma.testSession.findFirst({
    where: { teamId, date: dateValue },
    include: { _count: { select: { results: true } } },
  });
}

/**
 * Get or create a session for a calendar day.
 * Pass teamId null for the shared individual session that day.
 * Concurrent callers can race create; on P2002 we re-read and continue.
 */
export async function getOrCreateSessionForDate(
  teamId: string | null,
  date: string,
): Promise<TestSessionSummary> {
  const dateKey = normalizeTestSessionDateKey(date);
  const dateValue = testSessionDateValue(dateKey);

  const existing = await findSessionForTeamDate(teamId, dateValue);
  if (existing) {
    return serializeSessionSummary(existing);
  }

  const session = await createOrFindOnUniqueViolation(
    () =>
      prisma.testSession.create({
        data: {
          teamId,
          date: dateValue,
          label: teamId ? dateKey : `Individual ${dateKey}`,
        },
        include: { _count: { select: { results: true } } },
      }),
    () => findSessionForTeamDate(teamId, dateValue),
  );

  return serializeSessionSummary(session);
}

export async function createTestSession(
  teamId: string,
  input: { date: string; label: string; notes?: string | null },
) {
  return getOrCreateSessionForDate(teamId, input.date);
}

export async function getTestingWorkspace(teamSlug: string, date: string) {
  const waiverSample = await prisma.waiverSignature.findFirst({
    where: { teamSlug },
    select: { teamName: true },
    orderBy: { signedAt: "desc" },
  });
  const team = await ensureTestTeamBySlug(teamSlug, waiverSample?.teamName ?? teamSlug);
  await syncTestTeamRosterFromWaivers(team.id);
  const session = await getOrCreateSessionForDate(team.id, date);
  const detail = await getTestTeamDetail(team.id);
  if (!detail) {
    throw new Error("Team not found.");
  }
  const stations = await listActiveStations();
  return {
    mode: "team" as const,
    team: detail.team,
    players: detail.players,
    session,
    sessions: detail.sessions,
    stations,
  };
}

export async function getIndividualTestingWorkspace(date: string) {
  const dateKey = normalizeTestSessionDateKey(date);
  const session = await getOrCreateSessionForDate(null, dateKey);
  const stations = await listActiveStations();
  const resultPlayers = await prisma.testResult.findMany({
    where: { sessionId: session.id },
    select: { playerId: true },
    distinct: ["playerId"],
  });
  const players =
    resultPlayers.length === 0
      ? []
      : (
          await prisma.testPlayer.findMany({
            where: { id: { in: resultPlayers.map((row) => row.playerId) } },
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          })
        ).map(serializePlayer);

  const individualSessions = await prisma.testSession.findMany({
    where: { teamId: null },
    orderBy: { date: "desc" },
    take: 30,
    include: { _count: { select: { results: true } } },
  });

  return {
    mode: "individual" as const,
    team: null,
    players,
    session,
    sessions: individualSessions.map(serializeSessionSummary),
    stations,
  };
}

export async function listActiveMetrics() {
  const metrics = await prisma.testMetric.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  return metrics.map(serializeMetric);
}

export async function listAllMetrics() {
  const metrics = await prisma.testMetric.findMany({ orderBy: { sortOrder: "asc" } });
  return metrics.map(serializeMetric);
}

export async function listActiveStations() {
  const stations = await prisma.testStation.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  return stations.map(serializeStation);
}

export async function listAllStations() {
  const stations = await prisma.testStation.findMany({ orderBy: { sortOrder: "asc" } });
  return stations.map(serializeStation);
}

export async function upsertTestStation(input: {
  key: string;
  label: string;
  sortOrder: number;
  active: boolean;
  metricKeys: string[];
}) {
  const station = await prisma.testStation.upsert({
    where: { key: input.key.trim() },
    create: {
      key: input.key.trim(),
      label: input.label.trim(),
      sortOrder: input.sortOrder,
      active: input.active,
      metricKeys: input.metricKeys,
    },
    update: {
      label: input.label.trim(),
      sortOrder: input.sortOrder,
      active: input.active,
      metricKeys: input.metricKeys,
    },
  });
  return serializeStation(station);
}

async function resolveStationMetricKeys(stationKey: string) {
  if (stationKey === "all") {
    const metrics = await listActiveMetrics();
    return metrics.map((metric) => metric.key);
  }
  const station = await prisma.testStation.findUnique({ where: { key: stationKey } });
  if (!station || !station.active) {
    return null;
  }
  return station.metricKeys;
}

export async function getStationEntryData(
  sessionId: string,
  stationKey: string,
  options?: { includePlayerIds?: string[] },
) {
  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
    include: {
      team: {
        include: {
          roster: {
            include: { player: true },
            orderBy: { player: { lastName: "asc" } },
          },
        },
      },
    },
  });
  if (!session) {
    return null;
  }

  const metricKeys = await resolveStationMetricKeys(stationKey);
  if (!metricKeys || metricKeys.length === 0) {
    return null;
  }

  const metrics = await prisma.testMetric.findMany({
    where: { key: { in: metricKeys }, active: true },
    orderBy: { sortOrder: "asc" },
  });
  const orderedMetrics = metricKeys
    .map((key) => metrics.find((metric) => metric.key === key))
    .filter((metric): metric is (typeof metrics)[number] => Boolean(metric))
    .map(serializeMetric);

  let playersForEntry: Array<Parameters<typeof serializePlayer>[0]> = [];
  if (session.team) {
    playersForEntry = session.team.roster.map((entry) => entry.player);
  } else {
    const includeIds = (options?.includePlayerIds ?? []).filter(Boolean);
    const resultPlayerIds = (
      await prisma.testResult.findMany({
        where: { sessionId },
        select: { playerId: true },
        distinct: ["playerId"],
      })
    ).map((row) => row.playerId);
    const playerIdSet = new Set([...resultPlayerIds, ...includeIds]);
    if (playerIdSet.size > 0) {
      playersForEntry = await prisma.testPlayer.findMany({
        where: { id: { in: Array.from(playerIdSet) } },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });
    }
  }

  const playerIds = playersForEntry.map((player) => player.id);
  const sessionResults =
    playerIds.length === 0
      ? []
      : await prisma.testResult.findMany({
          where: {
            sessionId,
            metricKey: { in: metricKeys },
            playerId: { in: playerIds },
          },
        });
  const resultByPlayerMetric = new Map(
    sessionResults.map((result) => [`${result.playerId}:${result.metricKey}`, result]),
  );

  const priorResults =
    playerIds.length === 0
      ? []
      : await prisma.testResult.findMany({
          where: {
            playerId: { in: playerIds },
            metricKey: { in: metricKeys },
            sessionId: { not: sessionId },
            absent: false,
            skipped: false,
            best: { not: null },
            session: { date: { lt: session.date } },
          },
          include: { session: true, metric: true },
          orderBy: { session: { date: "desc" } },
        });

  const lastByPlayerMetric = new Map<string, { value: number; date: string }>();
  const personalBestByPlayerMetric = new Map<string, number>();

  for (const result of priorResults) {
    if (result.best === null) {
      continue;
    }
    const key = `${result.playerId}:${result.metricKey}`;
    if (!lastByPlayerMetric.has(key)) {
      lastByPlayerMetric.set(key, {
        value: result.best,
        date: formatTestSessionDateKey(result.session.date),
      });
    }
    const currentBest = personalBestByPlayerMetric.get(key);
    const isBetter =
      currentBest === undefined ||
      (result.metric.betterIs === "LOWER" ? result.best < currentBest : result.best > currentBest);
    if (isBetter) {
      personalBestByPlayerMetric.set(key, result.best);
    }
  }

  return {
    session: {
      id: session.id,
      teamId: session.teamId,
      teamSlug: session.team?.teamSlug ?? null,
      teamName: session.team?.name ?? "Individual",
      date: formatTestSessionDateKey(session.date),
      label: session.label,
    },
    stationKey,
    metrics: orderedMetrics,
    players: playersForEntry.map((player) => {
      const metricData: Record<
        string,
        {
          result: TestResultRecord | null;
          lastSession: { value: number; date: string } | null;
          personalBest: number | null;
        }
      > = {};

      for (const metric of orderedMetrics) {
        const resultKey = `${player.id}:${metric.key}`;
        const raw = resultByPlayerMetric.get(resultKey);
        metricData[metric.key] = {
          result: raw ? serializeResult(raw) : null,
          lastSession: lastByPlayerMetric.get(resultKey) ?? null,
          personalBest: personalBestByPlayerMetric.get(resultKey) ?? null,
        };
      }

      return {
        ...serializePlayer(player),
        metrics: metricData,
      };
    }),
  };
}

export async function upsertTestMetric(input: {
  key: string;
  label: string;
  unit: string;
  decimals: number;
  betterIs: TestBetterIs;
  category: string;
  active: boolean;
  sortOrder: number;
  inputType?: string;
}) {
  const metric = await prisma.testMetric.upsert({
    where: { key: input.key },
    create: {
      key: input.key.trim(),
      label: input.label.trim(),
      unit: input.unit.trim(),
      decimals: input.decimals,
      betterIs: input.betterIs,
      category: input.category.trim(),
      active: input.active,
      sortOrder: input.sortOrder,
      inputType: input.inputType?.trim() || "number",
    },
    update: {
      label: input.label.trim(),
      unit: input.unit.trim(),
      decimals: input.decimals,
      betterIs: input.betterIs,
      category: input.category.trim(),
      active: input.active,
      sortOrder: input.sortOrder,
      inputType: input.inputType?.trim() || "number",
    },
  });
  return serializeMetric(metric);
}

export async function getSessionEntryData(sessionId: string, metricKey: string) {
  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
    include: {
      team: {
        include: {
          roster: {
            include: { player: true },
            orderBy: { player: { lastName: "asc" } },
          },
        },
      },
      results: {
        where: { metricKey },
      },
    },
  });
  if (!session) {
    return null;
  }

  const metric = await prisma.testMetric.findUnique({ where: { key: metricKey } });
  if (!metric) {
    return null;
  }

  const players = session.team
    ? session.team.roster.map((entry) => entry.player)
    : await prisma.testPlayer.findMany({
        where: {
          id: { in: session.results.map((result) => result.playerId) },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });
  const playerIds = players.map((player) => player.id);
  const previousBests =
    playerIds.length === 0
      ? []
      : await prisma.testResult.findMany({
          where: {
            playerId: { in: playerIds },
            metricKey,
            sessionId: { not: sessionId },
            best: { not: null },
            absent: false,
            skipped: false,
          },
          include: { session: true },
          orderBy: { session: { date: "desc" } },
        });

  const previousBestByPlayer = new Map<string, number>();
  for (const result of previousBests) {
    if (result.best === null) {
      continue;
    }
    if (!previousBestByPlayer.has(result.playerId)) {
      previousBestByPlayer.set(result.playerId, result.best);
    } else {
      const current = previousBestByPlayer.get(result.playerId)!;
      const next =
        metric.betterIs === "LOWER"
          ? Math.min(current, result.best)
          : Math.max(current, result.best);
      previousBestByPlayer.set(result.playerId, next);
    }
  }

  const resultByPlayer = new Map(session.results.map((result) => [result.playerId, result]));

  return {
    session: {
      id: session.id,
      teamId: session.teamId,
      teamName: session.team?.name ?? "Individual",
      date: formatTestSessionDateKey(session.date),
      label: session.label,
    },
    metric: serializeMetric(metric),
    players: players.map((player) => {
      const result = resultByPlayer.get(player.id);
      return {
        ...serializePlayer(player),
        result: result ? serializeResult(result) : null,
        previousBest: previousBestByPlayer.get(player.id) ?? null,
      };
    }),
  };
}

export async function upsertTestResult(input: {
  sessionId: string;
  playerId: string;
  metricKey: string;
  attempts?: number[];
  absent?: boolean;
  skipped?: boolean;
  notes?: string | null;
}) {
  const metric = await prisma.testMetric.findUnique({ where: { key: input.metricKey } });
  if (!metric) {
    throw new Error("Metric not found.");
  }

  const attempts = (input.attempts ?? [])
    .slice(0, MAX_TEST_ATTEMPTS)
    .filter((value) => Number.isFinite(value));
  const absent = Boolean(input.absent);
  const skipped = Boolean(input.skipped);
  const best =
    absent || skipped ? null : computeBestAttempt(attempts, metric.betterIs);

  const result = await prisma.testResult.upsert({
    where: {
      sessionId_playerId_metricKey: {
        sessionId: input.sessionId,
        playerId: input.playerId,
        metricKey: input.metricKey,
      },
    },
    create: {
      sessionId: input.sessionId,
      playerId: input.playerId,
      metricKey: input.metricKey,
      attempts,
      best,
      absent,
      skipped,
      notes: input.notes?.trim() || null,
    },
    update: {
      attempts,
      best,
      absent,
      skipped,
      notes: input.notes === undefined ? undefined : input.notes?.trim() || null,
    },
  });

  return serializeResult(result);
}

export async function getSessionResultsGrid(sessionId: string) {
  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
    include: {
      team: {
        include: {
          roster: {
            include: { player: true },
            orderBy: { player: { lastName: "asc" } },
          },
        },
      },
      results: true,
    },
  });
  if (!session) {
    return null;
  }

  const metrics = await listActiveMetrics();
  const resultMap = new Map<string, TestResultRecord>();
  for (const result of session.results) {
    resultMap.set(`${result.playerId}:${result.metricKey}`, serializeResult(result));
  }

  const players = session.team
    ? session.team.roster.map((entry) => serializePlayer(entry.player))
    : (
        await prisma.testPlayer.findMany({
          where: {
            id: {
              in: Array.from(new Set(session.results.map((result) => result.playerId))),
            },
          },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        })
      ).map(serializePlayer);

  return {
    session: {
      id: session.id,
      teamId: session.teamId,
      teamName: session.team?.name ?? "Individual",
      date: formatTestSessionDateKey(session.date),
      label: session.label,
      notes: session.notes,
    },
    metrics,
    players,
    results: Object.fromEntries(resultMap),
  };
}

export async function buildSessionCsv(sessionId: string) {
  const grid = await getSessionResultsGrid(sessionId);
  if (!grid) {
    return null;
  }

  const escapeCsv = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const headers = [
    "Player",
    "Age",
    ...grid.metrics.map((metric) => metric.label),
  ];
  const rows = grid.players.map((player) => {
    const values = grid.metrics.map((metric) => {
      const result = grid.results[`${player.id}:${metric.key}`];
      if (!result || result.absent) {
        return "Absent";
      }
      if (result.skipped) {
        return "Skip";
      }
      if (result.best === null) {
        return "";
      }
      return String(result.best);
    });
    return [
      buildPlayerDisplayName(player.firstName, player.lastName),
      player.age === null ? "" : String(player.age),
      ...values,
    ];
  });

  return [headers.map(escapeCsv).join(","), ...rows.map((row) => row.map(escapeCsv).join(","))].join(
    "\n",
  );
}

export async function getTestPlayerProfile(playerId: string) {
  const player = await prisma.testPlayer.findUnique({
    where: { id: playerId },
    include: {
      teams: { include: { team: true } },
      waiverSignature: true,
      user: { select: { id: true, name: true, email: true } },
      results: {
        include: {
          session: { include: { team: true } },
          metric: true,
        },
        orderBy: [{ session: { date: "asc" } }, { metricKey: "asc" }],
      },
    },
  });
  if (!player) {
    return null;
  }

  const personalBests = new Map<string, { best: number; sessionDate: string; sessionLabel: string }>();
  const historyByMetric = new Map<string, Array<{ date: string; label: string; best: number | null }>>();

  for (const result of player.results) {
    if (result.absent || result.skipped || result.best === null) {
      continue;
    }
    const date = formatTestSessionDateKey(result.session.date);
    const history = historyByMetric.get(result.metricKey) ?? [];
    history.push({ date, label: result.session.label, best: result.best });
    historyByMetric.set(result.metricKey, history);

    const current = personalBests.get(result.metricKey);
    const betterIs = result.metric.betterIs;
    const isBetter =
      !current ||
      (betterIs === "LOWER" ? result.best < current.best : result.best > current.best);
    if (isBetter) {
      personalBests.set(result.metricKey, {
        best: result.best,
        sessionDate: date,
        sessionLabel: result.session.label,
      });
    }
  }

  const metrics = await listAllMetrics();

  return {
    player: serializePlayer(player),
    teams: player.teams.map((entry) => ({
      id: entry.team.id,
      name: entry.team.name,
      season: entry.team.season,
    })),
    linkedUser: player.user
      ? { id: player.user.id, name: player.user.name, email: player.user.email }
      : null,
    linkedWaiver: player.waiverSignature
      ? {
          id: player.waiverSignature.id,
          signedAt: player.waiverSignature.signedAt.toISOString(),
          teamName: player.waiverSignature.teamName,
        }
      : null,
    results: player.results.map((result) => ({
      ...serializeResult(result),
      sessionDate: formatTestSessionDateKey(result.session.date),
      sessionLabel: result.session.label,
      teamName: result.session.team?.name ?? "Individual",
      metricLabel: result.metric.label,
      metricUnit: result.metric.unit,
      metricDecimals: result.metric.decimals,
      metricInputType: result.metric.inputType,
    })),
    personalBests: Object.fromEntries(
      metrics.map((metric) => [metric.key, personalBests.get(metric.key) ?? null]),
    ),
    historyByMetric: Object.fromEntries(metrics.map((metric) => [metric.key, historyByMetric.get(metric.key) ?? []])),
    metrics,
  };
}

export async function buildCsvImportPreview(params: {
  teamId: string;
  csvText: string;
  columnMap: Record<string, string>;
}): Promise<CsvImportPreview> {
  const { headers, rows } = await import("@/lib/testing-shared").then((mod) =>
    mod.parseCsvText(params.csvText),
  );
  const team = await prisma.testTeam.findUnique({
    where: { id: params.teamId },
    include: { roster: { include: { player: true } } },
  });
  if (!team) {
    throw new Error("Team not found.");
  }

  const rosterByName = new Map(
    team.roster.map((entry) => [
      normalizePersonName(buildPlayerDisplayName(entry.player.firstName, entry.player.lastName)),
      entry.player,
    ]),
  );

  const previewRows = rows.map((cells, rowIndex) => {
    const getCell = (mappedHeader: string | undefined) => {
      if (!mappedHeader) {
        return "";
      }
      const columnIndex = headers.indexOf(mappedHeader);
      return columnIndex >= 0 ? (cells[columnIndex] ?? "") : "";
    };

    const playerName = getCell(params.columnMap.playerName);
    const { firstName, lastName } = splitPlayerName(playerName);
    const ageRaw = getCell(params.columnMap.age);
    const age = ageRaw ? Number(ageRaw) : null;
    const metrics: Record<string, number | null> = {};
    for (const [metricKey, headerName] of Object.entries(params.columnMap)) {
      if (metricKey === "playerName" || metricKey === "age") {
        continue;
      }
      const raw = getCell(headerName);
      metrics[metricKey] = raw ? Number(raw) : null;
    }

    const normalized = normalizePersonName(buildPlayerDisplayName(firstName, lastName));
    const match = rosterByName.get(normalized);

    return {
      rowIndex,
      playerName,
      firstName,
      lastName,
      age: Number.isFinite(age) ? age : null,
      metrics,
      matchPlayerId: match?.id ?? null,
      matchLabel: match ? ("existing" as const) : ("new" as const),
    };
  });

  return { headers, rows: previewRows };
}

export async function commitCsvImport(params: {
  teamId: string;
  sessionDate: string;
  sessionLabel: string;
  rows: Array<{
    firstName: string;
    lastName: string;
    age: number | null;
    playerId?: string | null;
    metrics: Record<string, number | null>;
  }>;
}) {
  const session = await createTestSession(params.teamId, {
    date: params.sessionDate,
    label: params.sessionLabel,
  });

  for (const row of params.rows) {
    let playerId = row.playerId ?? null;
    if (!playerId) {
      const created = await addPlayerToTeam(params.teamId, {
        firstName: row.firstName,
        lastName: row.lastName,
        age: row.age,
      });
      playerId = created.id;
    }

    for (const [metricKey, value] of Object.entries(row.metrics)) {
      if (value === null || !Number.isFinite(value)) {
        continue;
      }
      await upsertTestResult({
        sessionId: session.id,
        playerId,
        metricKey,
        attempts: [value],
      });
    }
  }

  return session;
}
