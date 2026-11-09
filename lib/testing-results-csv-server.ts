import "server-only";

import { prisma } from "@/lib/prisma";
import {
  RESULTS_CSV_METRIC_DEFINITIONS,
  parseResultsCsvText,
  type ResultsCsvImportCommitResult,
  type ResultsCsvImportMappingStatus,
  type ResultsCsvImportPreview,
  type ResultsCsvImportPreviewRow,
  type ResultsCsvImportPreviewValue,
  type ResultsCsvParsedRow,
} from "@/lib/testing-results-csv-shared";
import {
  addPlayerToTeam,
  getOrCreateSessionForDate,
  upsertTestMetric,
  upsertTestResult,
  upsertTestStation,
} from "@/lib/testing-server";
import {
  buildPlayerDisplayName,
  normalizePersonName,
} from "@/lib/testing-shared";

export type {
  ResultsCsvImportCommitResult,
  ResultsCsvImportPreview,
} from "@/lib/testing-results-csv-shared";

async function loadMetricAndStationState() {
  const [metrics, stations] = await Promise.all([
    prisma.testMetric.findMany({ select: { key: true } }),
    prisma.testStation.findMany(),
  ]);
  return {
    existingMetricKeys: new Set(metrics.map((metric) => metric.key)),
    stationsByKey: new Map(stations.map((station) => [station.key, station])),
  };
}

function mappingStatuses(existingMetricKeys: Set<string>): ResultsCsvImportMappingStatus[] {
  return RESULTS_CSV_METRIC_DEFINITIONS.map((definition) => ({
    ...definition,
    exists: existingMetricKeys.has(definition.metricKey),
  }));
}

async function resolveTeamsByExactName(teamNames: string[]) {
  const teams = await prisma.testTeam.findMany({
    where: { name: { in: teamNames } },
    include: {
      roster: { include: { player: true } },
    },
  });

  const byName = new Map(teams.map((team) => [team.name, team]));
  const missing = teamNames.filter((name) => !byName.has(name));
  return { byName, missing };
}

function findRosterPlayer(
  roster: Array<{ player: { id: string; firstName: string; lastName: string } }>,
  firstName: string,
  lastName: string,
) {
  const needle = normalizePersonName(buildPlayerDisplayName(firstName, lastName));
  return (
    roster.find(
      (entry) =>
        normalizePersonName(buildPlayerDisplayName(entry.player.firstName, entry.player.lastName)) ===
        needle,
    )?.player ?? null
  );
}

async function loadExistingResultsForPreview(
  rows: ResultsCsvParsedRow[],
  teamByName: Map<
    string,
    {
      id: string;
      roster: Array<{ player: { id: string; firstName: string; lastName: string } }>;
    }
  >,
) {
  const sessionKeys = new Map<string, { teamId: string; date: string }>();
  for (const row of rows) {
    const team = teamByName.get(row.teamName);
    if (!team) {
      continue;
    }
    const key = `${team.id}:${row.testDate}`;
    sessionKeys.set(key, { teamId: team.id, date: row.testDate });
  }

  const sessions = await Promise.all(
    Array.from(sessionKeys.values()).map(async ({ teamId, date }) => {
      const dateValue = new Date(`${date}T12:00:00.000Z`);
      const session = await prisma.testSession.findUnique({
        where: { teamId_date: { teamId, date: dateValue } },
        select: { id: true, teamId: true, date: true },
      });
      return session
        ? {
            key: `${teamId}:${date}`,
            sessionId: session.id,
          }
        : null;
    }),
  );

  const sessionIdByKey = new Map(
    sessions
      .filter((entry): entry is { key: string; sessionId: string } => Boolean(entry))
      .map((entry) => [entry.key, entry.sessionId]),
  );

  const sessionIds = Array.from(sessionIdByKey.values());
  const byTriple = new Map<string, number>();
  if (sessionIds.length === 0) {
    return { sessionIdByKey, existingBestByTriple: byTriple };
  }

  const results = await prisma.testResult.findMany({
    where: {
      sessionId: { in: sessionIds },
      absent: false,
      skipped: false,
    },
    select: {
      sessionId: true,
      playerId: true,
      metricKey: true,
      best: true,
    },
  });

  for (const result of results) {
    if (result.best === null) {
      continue;
    }
    byTriple.set(`${result.sessionId}:${result.playerId}:${result.metricKey}`, result.best);
  }
  return { sessionIdByKey, existingBestByTriple: byTriple };
}

export async function previewResultsCsvImport(csvText: string): Promise<ResultsCsvImportPreview> {
  const parsed = parseResultsCsvText(csvText);
  if (!parsed.ok) {
    return parsed;
  }

  const { byName, missing } = await resolveTeamsByExactName(parsed.teamNames);
  if (missing.length > 0) {
    return {
      ok: false,
      error: `Team not found (exact name required): ${missing.join(", ")}.`,
    };
  }

  const { existingMetricKeys } = await loadMetricAndStationState();
  const mappings = mappingStatuses(existingMetricKeys);
  const metricsToCreate = mappings.filter((mapping) => !mapping.exists);

  const existingLookup = await loadExistingResultsForPreview(parsed.rows, byName);
  const sessionIdByKey = existingLookup.sessionIdByKey;
  const existingBestByTriple = existingLookup.existingBestByTriple;

  const playersToCreateMap = new Map<
    string,
    { teamName: string; firstName: string; lastName: string }
  >();
  const previewRows: ResultsCsvImportPreviewRow[] = [];
  let resultCreateCount = 0;
  let resultUpdateCount = 0;

  for (const row of parsed.rows) {
    const team = byName.get(row.teamName)!;
    const matched = findRosterPlayer(team.roster, row.firstName, row.lastName);
    const playerStatus = matched ? ("existing" as const) : ("create" as const);
    if (!matched) {
      const key = `${team.id}:${normalizePersonName(buildPlayerDisplayName(row.firstName, row.lastName))}`;
      if (!playersToCreateMap.has(key)) {
        playersToCreateMap.set(key, {
          teamName: row.teamName,
          firstName: row.firstName,
          lastName: row.lastName,
        });
      }
    }

    const sessionKey = `${team.id}:${row.testDate}`;
    const sessionId = sessionIdByKey.get(sessionKey) ?? null;
    const values: ResultsCsvImportPreviewValue[] = [];

    for (const definition of RESULTS_CSV_METRIC_DEFINITIONS) {
      const newValue = row.metrics[definition.csvColumn];
      if (newValue === undefined) {
        continue;
      }
      let existingValue: number | null = null;
      if (matched && sessionId) {
        existingValue =
          existingBestByTriple.get(`${sessionId}:${matched.id}:${definition.metricKey}`) ?? null;
      }
      if (existingValue === null) {
        resultCreateCount += 1;
      } else {
        resultUpdateCount += 1;
      }
      values.push({
        csvColumn: definition.csvColumn,
        metricKey: definition.metricKey,
        label: definition.label,
        newValue,
        existingValue,
      });
    }

    previewRows.push({
      rowIndex: row.rowIndex,
      teamName: row.teamName,
      teamId: team.id,
      testDate: row.testDate,
      firstName: row.firstName,
      lastName: row.lastName,
      playerStatus,
      playerId: matched?.id ?? null,
      values,
    });
  }

  return {
    ok: true,
    mappings,
    metricsToCreate,
    playersToCreate: Array.from(playersToCreateMap.values()).sort((a, b) => {
      const team = a.teamName.localeCompare(b.teamName);
      if (team !== 0) {
        return team;
      }
      const last = a.lastName.localeCompare(b.lastName);
      if (last !== 0) {
        return last;
      }
      return a.firstName.localeCompare(b.firstName);
    }),
    rows: previewRows,
    resultCreateCount,
    resultUpdateCount,
  };
}

async function ensureImportMetricsAndStations(existingMetricKeys: Set<string>) {
  let metricsCreated = 0;
  const stationsNeeded = new Map<string, { label: string; sortOrder: number; metricKeys: Set<string> }>();

  for (const definition of RESULTS_CSV_METRIC_DEFINITIONS) {
    if (!existingMetricKeys.has(definition.metricKey)) {
      await upsertTestMetric({
        key: definition.metricKey,
        label: definition.label,
        unit: definition.unit,
        decimals: definition.decimals,
        betterIs: definition.betterIs,
        category: definition.category,
        active: true,
        sortOrder: definition.sortOrder,
        inputType: definition.inputType,
      });
      metricsCreated += 1;
      existingMetricKeys.add(definition.metricKey);
    }

    const station = stationsNeeded.get(definition.stationKey) ?? {
      label: definition.stationLabel,
      sortOrder: definition.stationSortOrder,
      metricKeys: new Set<string>(),
    };
    station.metricKeys.add(definition.metricKey);
    stationsNeeded.set(definition.stationKey, station);
  }

  const existingStations = await prisma.testStation.findMany();
  const stationByKey = new Map(existingStations.map((station) => [station.key, station]));

  for (const [stationKey, planned] of stationsNeeded.entries()) {
    const existing = stationByKey.get(stationKey);
    const metricKeys = new Set(existing?.metricKeys ?? []);
    for (const key of planned.metricKeys) {
      metricKeys.add(key);
    }
    // Keep known throwing metrics together when creating the station.
    if (stationKey === "throwing") {
      for (const key of ["throw_velo_if", "throw_velo_of", "pitch_velo", "pulldown_velo"]) {
        if (existingMetricKeys.has(key) || key === "pulldown_velo") {
          metricKeys.add(key);
        }
      }
    }
    if (stationKey === "speed_power") {
      for (const key of ["ten_yard", "thirty_yard", "sixty_yard", "pro_agility", "broad_jump"]) {
        if (existingMetricKeys.has(key) || planned.metricKeys.has(key)) {
          metricKeys.add(key);
        }
      }
    }

    await upsertTestStation({
      key: stationKey,
      label: existing?.label ?? planned.label,
      sortOrder: existing?.sortOrder ?? planned.sortOrder,
      active: existing?.active ?? true,
      metricKeys: Array.from(metricKeys),
    });
  }

  return metricsCreated;
}

export async function commitResultsCsvImport(csvText: string): Promise<ResultsCsvImportCommitResult> {
  const preview = await previewResultsCsvImport(csvText);
  if (!preview.ok) {
    return preview;
  }

  const { existingMetricKeys } = await loadMetricAndStationState();
  const metricsCreated = await ensureImportMetricsAndStations(existingMetricKeys);

  const parsed = parseResultsCsvText(csvText);
  if (!parsed.ok) {
    return parsed;
  }

  const { byName, missing } = await resolveTeamsByExactName(parsed.teamNames);
  if (missing.length > 0) {
    return {
      ok: false,
      error: `Team not found (exact name required): ${missing.join(", ")}.`,
    };
  }

  // Refresh roster maps as we create players.
  const rosterByTeam = new Map(
    Array.from(byName.entries()).map(([name, team]) => [
      name,
      {
        teamId: team.id,
        players: new Map(
          team.roster.map((entry) => [
            normalizePersonName(
              buildPlayerDisplayName(entry.player.firstName, entry.player.lastName),
            ),
            entry.player.id,
          ]),
        ),
      },
    ]),
  );

  let playersCreated = 0;
  let resultsUpserted = 0;
  const sessionsTouched = new Set<string>();

  for (const row of parsed.rows) {
    const roster = rosterByTeam.get(row.teamName)!;
    const nameKey = normalizePersonName(buildPlayerDisplayName(row.firstName, row.lastName));
    let playerId = roster.players.get(nameKey) ?? null;

    if (!playerId) {
      const created = await addPlayerToTeam(roster.teamId, {
        firstName: row.firstName,
        lastName: row.lastName,
      });
      playerId = created.id;
      roster.players.set(nameKey, playerId);
      playersCreated += 1;
    }

    const session = await getOrCreateSessionForDate(roster.teamId, row.testDate);
    sessionsTouched.add(session.id);

    for (const definition of RESULTS_CSV_METRIC_DEFINITIONS) {
      const value = row.metrics[definition.csvColumn];
      if (value === undefined) {
        continue;
      }
      await upsertTestResult({
        sessionId: session.id,
        playerId,
        metricKey: definition.metricKey,
        attempts: [value],
      });
      resultsUpserted += 1;
    }
  }

  return {
    ok: true,
    playersCreated,
    metricsCreated,
    resultsUpserted,
    sessionsTouched: sessionsTouched.size,
  };
}
