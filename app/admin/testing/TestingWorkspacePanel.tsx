"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  adminFetchJson,
  ADMIN_FETCH_COULD_NOT_LOAD_JSON,
} from "@/lib/admin-fetch-shared";
import {
  computeBestAttempt,
  feetInchesToInches,
  formatMetricValue,
  inchesToFeetInches,
  MAX_TEST_ATTEMPTS,
  normalizeTestSessionDateKey,
  type TestMetricRecord,
  type TestPlayerSummary,
  type TestResultRecord,
  type TestSessionSummary,
  type TestStationRecord,
  type TestTeamOption,
  type TestingMode,
  type TestingUserSearchHit,
} from "@/lib/testing-shared";
import {
  enqueuePendingTestResult,
  flushPendingTestResults,
  listPendingTestResults,
} from "@/lib/testing-offline-queue";

type MetricEntry = {
  result: TestResultRecord | null;
  lastSession: { value: number; date: string } | null;
  personalBest: number | null;
};

type EntryPlayer = TestPlayerSummary & {
  metrics: Record<string, MetricEntry>;
};

type EntryData = {
  session: {
    id: string;
    teamId: string | null;
    teamSlug: string | null;
    teamName: string;
    date: string;
    label: string;
  };
  stationKey: string;
  metrics: TestMetricRecord[];
  players: EntryPlayer[];
};

type WorkspaceData = {
  mode?: TestingMode;
  team: { id: string; name: string; teamSlug: string } | null;
  players: TestPlayerSummary[];
  session: TestSessionSummary;
  sessions: TestSessionSummary[];
  stations: TestStationRecord[];
};

type SyncState = "saved" | "waiting" | "syncing";

type DraftSlot = { a: string; b: string; c: string; d: string };

function todayIso() {
  return normalizeTestSessionDateKey(null);
}

function emptyDraft(): DraftSlot {
  return { a: "", b: "", c: "", d: "" };
}

function draftFromResult(metric: TestMetricRecord, result: TestResultRecord | null): DraftSlot {
  if (!result) {
    return emptyDraft();
  }
  if (metric.inputType === "feet_inches") {
    const first = result.attempts[0];
    const second = result.attempts[1];
    const firstSplit = first !== undefined && first !== null ? inchesToFeetInches(first) : null;
    const secondSplit = second !== undefined && second !== null ? inchesToFeetInches(second) : null;
    return {
      a: firstSplit ? String(firstSplit.feet) : "",
      b: firstSplit ? String(firstSplit.inches) : "",
      c: secondSplit ? String(secondSplit.feet) : "",
      d: secondSplit ? String(secondSplit.inches) : "",
    };
  }
  return {
    a: result.attempts[0] !== undefined && result.attempts[0] !== null ? String(result.attempts[0]) : "",
    b: result.attempts[1] !== undefined && result.attempts[1] !== null ? String(result.attempts[1]) : "",
    c: "",
    d: "",
  };
}

function parseDraftAttempts(metric: TestMetricRecord, draft: DraftSlot): number[] {
  if (metric.inputType === "feet_inches") {
    const attempts: number[] = [];
    const first = feetInchesToInches(Number(draft.a || 0), Number(draft.b || 0));
    const second = feetInchesToInches(Number(draft.c || 0), Number(draft.d || 0));
    if (draft.a.trim() || draft.b.trim()) {
      if (first !== null && Number.isFinite(first)) {
        attempts.push(first);
      }
    }
    if (draft.c.trim() || draft.d.trim()) {
      if (second !== null && Number.isFinite(second)) {
        attempts.push(second);
      }
    }
    return attempts.slice(0, MAX_TEST_ATTEMPTS);
  }
  const attempts: number[] = [];
  for (const raw of [draft.a, draft.b]) {
    const trimmed = raw.trim();
    if (!trimmed) {
      continue;
    }
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      attempts.push(parsed);
    }
  }
  return attempts.slice(0, MAX_TEST_ATTEMPTS);
}

function isMetricComplete(metric: TestMetricRecord, draft: DraftSlot) {
  if (metric.inputType === "feet_inches") {
    const firstFilled = draft.a.trim() !== "" || draft.b.trim() !== "";
    const secondFilled = draft.c.trim() !== "" || draft.d.trim() !== "";
    return firstFilled && secondFilled;
  }
  return draft.a.trim() !== "" && draft.b.trim() !== "";
}

function isPlayerStationComplete(player: EntryPlayer, metrics: TestMetricRecord[], drafts: Record<string, DraftSlot>) {
  return metrics.every((metric) => {
    const key = `${player.id}:${metric.key}`;
    return isMetricComplete(metric, drafts[key] ?? emptyDraft());
  });
}

function playerDisplayName(player: Pick<TestPlayerSummary, "firstName" | "lastName">) {
  return `${player.firstName} ${player.lastName}`.trim();
}

function sortPlayersAlphabetical(a: EntryPlayer, b: EntryPlayer) {
  const last = a.lastName.localeCompare(b.lastName);
  if (last !== 0) {
    return last;
  }
  return a.firstName.localeCompare(b.firstName);
}

function firstEmptyInputId(
  player: EntryPlayer,
  metrics: TestMetricRecord[],
  drafts: Record<string, DraftSlot>,
) {
  for (const metric of metrics) {
    const draft = drafts[`${player.id}:${metric.key}`] ?? emptyDraft();
    if (metric.inputType === "feet_inches") {
      if (!draft.a.trim() && !draft.b.trim()) {
        return `${player.id}-${metric.key}-a`;
      }
      if (!draft.c.trim() && !draft.d.trim()) {
        return `${player.id}-${metric.key}-c`;
      }
      continue;
    }
    if (!draft.a.trim()) {
      return `${player.id}-${metric.key}-a`;
    }
    if (!draft.b.trim()) {
      return `${player.id}-${metric.key}-b`;
    }
  }
  return null;
}

function focusInputById(inputId: string | null) {
  if (!inputId) {
    return;
  }
  window.setTimeout(() => {
    const element = document.getElementById(inputId);
    if (element instanceof HTMLInputElement) {
      element.focus();
    }
  }, 50);
}

export default function TestingWorkspacePanel() {
  const searchRef = useRef<HTMLInputElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const pendingFocusPlayerId = useRef<string | null>(null);
  const [mode, setMode] = useState<TestingMode>("team");
  const [teamOptions, setTeamOptions] = useState<TestTeamOption[]>([]);
  const [teamSlug, setTeamSlug] = useState("");
  const [date, setDate] = useState(todayIso());
  const [stationKey, setStationKey] = useState("");
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [entry, setEntry] = useState<EntryData | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftSlot>>({});
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showNewTeam, setShowNewTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [addFirst, setAddFirst] = useState("");
  const [addLast, setAddLast] = useState("");
  const [addAge, setAddAge] = useState("");
  const [linkUserQuery, setLinkUserQuery] = useState("");
  const [linkUserHits, setLinkUserHits] = useState<TestingUserSearchHit[]>([]);
  const [linkedUser, setLinkedUser] = useState<TestingUserSearchHit | null>(null);
  const [existingPlayerQuery, setExistingPlayerQuery] = useState("");
  const [existingPlayerHits, setExistingPlayerHits] = useState<TestPlayerSummary[]>([]);
  const [includePlayerIds, setIncludePlayerIds] = useState<string[]>([]);
  const [syncState, setSyncState] = useState<SyncState>("saved");
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadTeamOptions = useCallback(async () => {
    const res = await adminFetchJson<{ teams?: TestTeamOption[] }>(
      "/api/admin/testing/teams",
      { cache: "no-store" },
      {
        context: "testing-team-list",
        notJsonUserMessage: ADMIN_FETCH_COULD_NOT_LOAD_JSON,
      },
    );
    if (!res.ok) {
      throw new Error(res.userMessage);
    }
    const teams = res.data.teams ?? [];
    setTeamOptions(teams);
    setTeamSlug((current) => current || teams[0]?.teamSlug || "");
  }, []);

  const loadWorkspace = useCallback(async () => {
    if (mode === "team" && !teamSlug) {
      return;
    }
    const params = new URLSearchParams({
      mode,
      date,
    });
    if (mode === "team") {
      params.set("teamSlug", teamSlug);
    }
    const res = await adminFetchJson<WorkspaceData & { error?: string }>(
      `/api/admin/testing/workspace?${params.toString()}`,
      { cache: "no-store" },
      {
        context: "testing-workspace",
        okUserMessage: "Couldn't load testing workspace. Try again.",
        notJsonUserMessage: ADMIN_FETCH_COULD_NOT_LOAD_JSON,
      },
    );
    if (!res.ok) {
      throw new Error(res.userMessage);
    }
    setWorkspace(res.data);
  }, [mode, teamSlug, date]);

  useEffect(() => {
    if (!workspace?.stations?.length) {
      return;
    }
    setStationKey((current) => {
      const keys = new Set(workspace.stations.map((s) => s.key));
      if (current && keys.has(current)) {
        return current;
      }
      return workspace.stations[0]?.key ?? current;
    });
  }, [workspace]);

  const loadEntry = useCallback(async () => {
    if ((mode === "team" && !teamSlug) || !stationKey) {
      return;
    }
    const params = new URLSearchParams({
      mode,
      date,
      stationKey,
    });
    if (mode === "team") {
      params.set("teamSlug", teamSlug);
    }
    for (const playerId of includePlayerIds) {
      params.append("playerId", playerId);
    }
    const res = await adminFetchJson<EntryData & { error?: string }>(
      `/api/admin/testing/entry?${params.toString()}`,
      { cache: "no-store" },
      {
        context: "testing-entry",
        okUserMessage: "Couldn't load testing results. Try again.",
        notJsonUserMessage: ADMIN_FETCH_COULD_NOT_LOAD_JSON,
      },
    );
    if (!res.ok) {
      throw new Error(res.userMessage);
    }
    const data = res.data;
    setEntry(data);
    const nextDrafts: Record<string, DraftSlot> = {};
    for (const player of data.players) {
      for (const metric of data.metrics) {
        const key = `${player.id}:${metric.key}`;
        nextDrafts[key] = draftFromResult(metric, player.metrics[metric.key]?.result ?? null);
      }
    }
    setDrafts(nextDrafts);
  }, [mode, teamSlug, date, stationKey, includePlayerIds]);

  const refreshPending = useCallback(() => {
    setPendingCount(listPendingTestResults().length);
  }, []);

  const syncPending = useCallback(async () => {
    setSyncState("syncing");
    const result = await flushPendingTestResults();
    refreshPending();
    if (result.failed > 0 || listPendingTestResults().length > 0) {
      setSyncState("waiting");
    } else {
      setSyncState("saved");
    }
    await loadEntry();
  }, [loadEntry, refreshPending]);

  useEffect(() => {
    void loadTeamOptions().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Failed to load teams.");
    });
  }, [loadTeamOptions]);

  useEffect(() => {
    if (mode === "team" && !teamSlug) {
      setWorkspace(null);
      setEntry(null);
      return;
    }
    void loadWorkspace().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Failed to load workspace.");
    });
  }, [loadWorkspace, mode, teamSlug]);

  useEffect(() => {
    if ((mode === "team" && !teamSlug) || !stationKey) {
      return;
    }
    void loadEntry().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Failed to load entry.");
    });
  }, [loadEntry, mode, teamSlug, stationKey]);

  useEffect(() => {
    if (!entry || !pendingFocusPlayerId.current) {
      return;
    }
    const player = entry.players.find((entryPlayer) => entryPlayer.id === pendingFocusPlayerId.current);
    if (player) {
      setSearch(playerDisplayName(player));
      setSearchOpen(false);
      focusInputById(firstEmptyInputId(player, entry.metrics, drafts));
    }
    pendingFocusPlayerId.current = null;
  }, [entry, drafts]);

  useEffect(() => {
    refreshPending();
    void syncPending();
    const onlineHandler = () => void syncPending();
    window.addEventListener("online", onlineHandler);
    return () => window.removeEventListener("online", onlineHandler);
  }, [refreshPending, syncPending]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!searchBoxRef.current) {
        return;
      }
      const target = event.target;
      if (target instanceof Node && !searchBoxRef.current.contains(target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  const stationOptions = useMemo(() => {
    const stations = workspace?.stations ?? [];
    return [...stations, { key: "all", label: "All tests", sortOrder: 999, active: true, metricKeys: [] }];
  }, [workspace?.stations]);

  const sessionDates = useMemo(() => {
    const dates = new Set<string>([todayIso(), date]);
    for (const session of workspace?.sessions ?? []) {
      dates.add(session.date);
    }
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [workspace?.sessions, date]);

  const searchListPlayers = useMemo(() => {
    if (!entry) {
      return [] as EntryPlayer[];
    }
    const query = search.trim().toLowerCase();
    let players = [...entry.players].sort(sortPlayersAlphabetical);
    if (query) {
      players = players.filter((player) =>
        playerDisplayName(player).toLowerCase().includes(query),
      );
    }
    return players;
  }, [entry, search]);

  const filteredPlayers = useMemo(() => {
    if (!entry) {
      return [] as EntryPlayer[];
    }
    const query = search.trim().toLowerCase();
    let players = entry.players;
    if (query) {
      players = players.filter((player) =>
        playerDisplayName(player).toLowerCase().includes(query),
      );
    }
    return [...players].sort((a, b) => {
      const aDone = isPlayerStationComplete(a, entry.metrics, drafts);
      const bDone = isPlayerStationComplete(b, entry.metrics, drafts);
      if (aDone !== bDone) {
        return aDone ? 1 : -1;
      }
      return sortPlayersAlphabetical(a, b);
    });
  }, [entry, search, drafts]);

  function selectSearchPlayer(player: EntryPlayer) {
    setSearch(playerDisplayName(player));
    setSearchOpen(false);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    focusInputById(firstEmptyInputId(player, entry?.metrics ?? [], drafts));
  }

  function clearSearch() {
    setSearch("");
    setSearchOpen(false);
  }

  async function createTeam() {
    if (!newTeamName.trim()) {
      return;
    }
    setError(null);
    const res = await adminFetchJson<{ team?: TestTeamOption; error?: string }>(
      "/api/admin/testing/teams",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName.trim() }),
      },
      {
        context: "testing-create-team",
        okUserMessage: "Couldn't create team. Try again.",
        notJsonUserMessage: ADMIN_FETCH_COULD_NOT_LOAD_JSON,
      },
    );
    if (!res.ok) {
      setError(res.userMessage);
      return;
    }
    const { team, error: err } = res.data;
    if (!team) {
      setError(err ?? "Failed to create team.");
      return;
    }
    setNewTeamName("");
    setShowNewTeam(false);
    setTeamSlug(team.teamSlug);
    await loadTeamOptions();
  }

  async function searchLinkUsers(query: string) {
    setLinkUserQuery(query);
    if (query.trim().length < 2) {
      setLinkUserHits([]);
      return;
    }
    const res = await adminFetchJson<{ users?: TestingUserSearchHit[] }>(
      `/api/admin/testing/users/search?q=${encodeURIComponent(query.trim())}`,
      { cache: "no-store" },
      {
        context: "testing-user-search",
        okUserMessage: "Couldn't search accounts. Try again.",
        notJsonUserMessage: ADMIN_FETCH_COULD_NOT_LOAD_JSON,
      },
    );
    if (!res.ok) {
      setError(res.userMessage);
      return;
    }
    setLinkUserHits(res.data.users ?? []);
  }

  async function searchExistingPlayers(query: string) {
    if (query.trim().length < 1) {
      setExistingPlayerHits([]);
      return;
    }
    const res = await adminFetchJson<{ players?: TestPlayerSummary[] }>(
      `/api/admin/testing/players?q=${encodeURIComponent(query.trim())}`,
      { cache: "no-store" },
      {
        context: "testing-player-search",
        okUserMessage: "Couldn't search players. Try again.",
        notJsonUserMessage: ADMIN_FETCH_COULD_NOT_LOAD_JSON,
      },
    );
    if (!res.ok) {
      setError(res.userMessage);
      return;
    }
    setExistingPlayerHits(res.data.players ?? []);
  }

  function resetAddPlayerForm() {
    setAddFirst("");
    setAddLast("");
    setAddAge("");
    setLinkUserQuery("");
    setLinkUserHits([]);
    setLinkedUser(null);
    setExistingPlayerQuery("");
    setExistingPlayerHits([]);
    setShowAddPlayer(false);
  }

  async function addExistingPlayerToSession(player: TestPlayerSummary) {
    setError(null);
    if (mode === "team") {
      if (!workspace?.team?.id) {
        setError("Wait for the team to finish loading, then add the player again.");
        return;
      }
      const res = await adminFetchJson<{ player?: TestPlayerSummary; error?: string }>(
        `/api/admin/testing/teams/${workspace.team.id}/players`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ existingPlayerId: player.id }),
        },
        {
          context: "testing-add-existing-player",
          okUserMessage: "Couldn't add player. Try again.",
          notJsonUserMessage: ADMIN_FETCH_COULD_NOT_LOAD_JSON,
        },
      );
      if (!res.ok) {
        setError(res.userMessage);
        return;
      }
      if (!res.data.player) {
        setError(res.data.error ?? "Failed to add player.");
        return;
      }
    } else {
      setIncludePlayerIds((current) =>
        current.includes(player.id) ? current : [...current, player.id],
      );
    }
    pendingFocusPlayerId.current = player.id;
    resetAddPlayerForm();
    await loadWorkspace();
    await loadEntry();
  }

  async function addPlayer() {
    if (mode === "team" && !workspace?.team?.id) {
      setError("Wait for the team to finish loading, then add the player again.");
      return;
    }
    if (!addFirst.trim() || !addLast.trim()) {
      setError("First and last name are required.");
      return;
    }
    setError(null);
    const payload = {
      firstName: addFirst,
      lastName: addLast,
      age: addAge ? Number(addAge) : null,
      userId: linkedUser?.id ?? null,
      teamId: mode === "team" ? workspace?.team?.id ?? null : null,
    };
    const url =
      mode === "team" && workspace?.team?.id
        ? `/api/admin/testing/teams/${workspace.team.id}/players`
        : "/api/admin/testing/players";
    const res = await adminFetchJson<{ player?: TestPlayerSummary; error?: string }>(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      {
        context: "testing-add-player",
        okUserMessage: "Couldn't add player. Try again.",
        notJsonUserMessage: ADMIN_FETCH_COULD_NOT_LOAD_JSON,
      },
    );
    if (!res.ok) {
      setError(res.userMessage);
      return;
    }
    const data = res.data;
    if (!data.player) {
      setError(data.error ?? "Failed to add player.");
      return;
    }
    if (mode === "individual") {
      setIncludePlayerIds((current) =>
        current.includes(data.player!.id) ? current : [...current, data.player!.id],
      );
    }
    pendingFocusPlayerId.current = data.player.id;
    resetAddPlayerForm();
    await loadWorkspace();
    await loadEntry();
  }

  async function saveMetricRow(playerId: string, metric: TestMetricRecord) {
    if (!entry) {
      return;
    }
    const draftKey = `${playerId}:${metric.key}`;
    const draft = drafts[draftKey] ?? emptyDraft();
    const attempts = parseDraftAttempts(metric, draft);

    setError(null);
    try {
      const saveRes = await adminFetchJson(
        `/api/admin/testing/sessions/${entry.session.id}/results`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId,
            metricKey: metric.key,
            attempts,
          }),
        },
        {
          context: "testing-save-result",
          okUserMessage: "Couldn't save testing result. Try again.",
          notJsonUserMessage: ADMIN_FETCH_COULD_NOT_LOAD_JSON,
        },
      );
      if (!saveRes.ok) {
        throw new Error(saveRes.userMessage);
      }
      setSyncState("saved");
      await loadEntry();
    } catch {
      enqueuePendingTestResult({
        sessionId: entry.session.id,
        playerId,
        metricKey: metric.key,
        attempts,
      });
      refreshPending();
      setSyncState("waiting");
    }

    clearSearch();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    searchRef.current?.focus();
  }

  function updateDraft(draftKey: string, patch: Partial<DraftSlot>) {
    setDrafts((current) => ({
      ...current,
      [draftKey]: { ...(current[draftKey] ?? emptyDraft()), ...patch },
    }));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm text-zinc-400 hover:text-zinc-200">
            Back to admin
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Testing</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/testing/import"
            className="rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-zinc-300"
          >
            Import results from CSV
          </Link>
          <Link
            href="/admin/testing/metrics"
            className="rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-zinc-300"
          >
            Metrics
          </Link>
          {entry?.session.teamId ? (
            <Link
              href={`/admin/testing/teams/${entry.session.teamId}/sessions/${entry.session.id}`}
              className="rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-zinc-300"
            >
              Results grid
            </Link>
          ) : null}
          <span
            className={`rounded-full px-3 py-2 text-xs font-semibold ${
              syncState === "saved"
                ? "bg-[#22c55e]/20 text-[#22c55e]"
                : syncState === "syncing"
                  ? "bg-yellow-500/20 text-yellow-300"
                  : "bg-orange-500/20 text-orange-300"
            }`}
          >
            {syncState === "saved"
              ? "Saved"
              : syncState === "syncing"
                ? "Syncing..."
                : `Waiting to sync (${pendingCount})`}
          </span>
        </div>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "team", label: "Team" },
            { key: "individual", label: "Individual" },
          ] as const
        ).map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => {
              setError(null);
              setMode(option.key);
              setIncludePlayerIds([]);
              setShowAddPlayer(false);
              setShowNewTeam(false);
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              mode === option.key
                ? "bg-[#22c55e] text-[#0A1628]"
                : "border border-[#2b3650] text-zinc-300"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {mode === "team" ? (
          <label className="text-sm text-zinc-300">
            Team
            <select
              value={teamSlug}
              onChange={(event) => {
                if (event.target.value === "__new__") {
                  setShowNewTeam(true);
                  return;
                }
                setShowNewTeam(false);
                setTeamSlug(event.target.value);
              }}
              className="mt-1 w-full rounded-xl border border-[#2b3650] bg-[#0a1628] px-4 py-3 text-sm text-zinc-100"
            >
              <option value="">Select team</option>
              {teamOptions.map((team) => (
                <option key={team.teamSlug} value={team.teamSlug}>
                  {team.name}
                </option>
              ))}
              <option value="__new__">+ New team</option>
            </select>
          </label>
        ) : (
          <div className="text-sm text-zinc-300">
            Mode
            <p className="mt-1 rounded-xl border border-[#2b3650] bg-[#0a1628] px-4 py-3 text-sm text-zinc-100">
              Individual (no team required)
            </p>
          </div>
        )}
        <label className="text-sm text-zinc-300">
          Date
          <select
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[#2b3650] bg-[#0a1628] px-4 py-3 text-sm text-zinc-100"
          >
            {sessionDates.map((sessionDate) => (
              <option key={sessionDate} value={sessionDate}>
                {sessionDate}
              </option>
            ))}
          </select>
        </label>
      </div>

      {showNewTeam ? (
        <div className="flex flex-wrap gap-2">
          <input
            value={newTeamName}
            onChange={(event) => setNewTeamName(event.target.value)}
            placeholder="Team name"
            className="min-w-0 flex-1 rounded-xl border border-[#2b3650] bg-[#0a1628] px-4 py-3 text-sm text-zinc-100"
          />
          <button
            type="button"
            onClick={() => void createTeam()}
            className="rounded-full bg-[#22c55e] px-4 py-3 text-sm font-semibold text-[#0A1628]"
          >
            Add team
          </button>
        </div>
      ) : null}

      {mode === "individual" || teamSlug ? (
        <>
          <div className="flex flex-wrap gap-2">
            {stationOptions.map((station) => (
              <button
                key={station.key}
                type="button"
                onClick={() => setStationKey(station.key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  stationKey === station.key
                    ? "bg-[#22c55e] text-[#0A1628]"
                    : "border border-[#2b3650] text-zinc-300"
                }`}
              >
                {station.label}
              </button>
            ))}
          </div>

          <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-4">
            <button
              type="button"
              onClick={() => setShowAddPlayer((current) => !current)}
              className="flex w-full items-center justify-between rounded-xl border border-[#2b3650] px-4 py-4 text-left text-sm font-semibold text-zinc-200"
            >
              <span>+ Add player</span>
              <span className="text-zinc-500">{showAddPlayer ? "^" : "v"}</span>
            </button>
            {showAddPlayer ? (
              <div className="mt-3 space-y-3">
                <div>
                  <p className="mb-2 text-xs text-zinc-500">
                    Pick an existing testing player, or enter a new name below.
                  </p>
                  <input
                    value={existingPlayerQuery}
                    onChange={(event) => {
                      const value = event.target.value;
                      setExistingPlayerQuery(value);
                      void searchExistingPlayers(value);
                    }}
                    placeholder="Search existing players by name"
                    className="w-full rounded-xl border border-[#2b3650] bg-[#0a1628] px-3 py-3 text-sm text-zinc-100"
                  />
                  {existingPlayerHits.length > 0 ? (
                    <ul className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-[#2b3650] bg-[#0b1324]">
                      {existingPlayerHits.map((player) => (
                        <li key={player.id}>
                          <button
                            type="button"
                            onClick={() => void addExistingPlayerToSession(player)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm text-zinc-100 hover:bg-[#0a1628]"
                          >
                            <span>{playerDisplayName(player)}</span>
                            <span className="text-xs text-zinc-500">
                              {player.userId ? "Linked" : "Name only"}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <div className="grid gap-2 sm:grid-cols-4">
                  <input
                    value={addFirst}
                    onChange={(event) => setAddFirst(event.target.value)}
                    placeholder="First"
                    className="rounded-xl border border-[#2b3650] bg-[#0a1628] px-3 py-3 text-sm text-zinc-100"
                  />
                  <input
                    value={addLast}
                    onChange={(event) => setAddLast(event.target.value)}
                    placeholder="Last"
                    className="rounded-xl border border-[#2b3650] bg-[#0a1628] px-3 py-3 text-sm text-zinc-100"
                  />
                  <input
                    value={addAge}
                    onChange={(event) => setAddAge(event.target.value)}
                    placeholder="Age"
                    inputMode="numeric"
                    className="rounded-xl border border-[#2b3650] bg-[#0a1628] px-3 py-3 text-sm text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() => void addPlayer()}
                    className="rounded-full bg-[#22c55e] px-4 py-3 text-sm font-semibold text-[#0A1628]"
                  >
                    Add
                  </button>
                </div>
                <div>
                  <p className="mb-2 text-xs text-zinc-500">
                    Optional: link to an existing app account (name or email). Leave blank for
                    name only; you can link later.
                  </p>
                  {linkedUser ? (
                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#2b3650] bg-[#0a1628] px-3 py-3 text-sm text-zinc-100">
                      <span>
                        Linked: {linkedUser.name || linkedUser.email} ({linkedUser.email})
                      </span>
                      <button
                        type="button"
                        onClick={() => setLinkedUser(null)}
                        className="rounded-full border border-[#2b3650] px-3 py-1 text-xs text-zinc-300"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        value={linkUserQuery}
                        onChange={(event) => void searchLinkUsers(event.target.value)}
                        placeholder="Search app accounts by name or email"
                        className="w-full rounded-xl border border-[#2b3650] bg-[#0a1628] px-3 py-3 text-sm text-zinc-100"
                      />
                      {linkUserHits.length > 0 ? (
                        <ul className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-[#2b3650] bg-[#0b1324]">
                          {linkUserHits.map((user) => (
                            <li key={user.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setLinkedUser(user);
                                  setLinkUserHits([]);
                                  if (!addFirst.trim() && user.playerFirstName) {
                                    setAddFirst(user.playerFirstName);
                                  }
                                  if (!addLast.trim() && user.playerLastName) {
                                    setAddLast(user.playerLastName);
                                  }
                                }}
                                className="flex w-full flex-col gap-0.5 px-4 py-3 text-left text-sm text-zinc-100 hover:bg-[#0a1628]"
                              >
                                <span>
                                  {user.name ||
                                    [user.playerFirstName, user.playerLastName]
                                      .filter(Boolean)
                                      .join(" ") ||
                                    user.email}
                                </span>
                                <span className="text-xs text-zinc-500">{user.email}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </section>

          <div
            ref={searchBoxRef}
            className="sticky top-0 z-10 rounded-2xl border border-[#2b3650] bg-[#0a1628] p-3"
          >
            <div className="flex items-center gap-2">
              <input
                ref={searchRef}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search or pick a player"
                className="min-w-0 flex-1 rounded-xl border border-[#2b3650] bg-[#0b1324] px-4 py-3 text-base text-zinc-100"
              />
              {search ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="rounded-full border border-[#2b3650] px-3 py-2 text-sm text-zinc-300"
                >
                  X
                </button>
              ) : null}
            </div>
            {searchOpen && entry ? (
              <ul className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-[#2b3650] bg-[#0b1324]">
                {searchListPlayers.length === 0 ? (
                  <li className="px-4 py-4 text-sm text-zinc-500">No players match.</li>
                ) : (
                  searchListPlayers.map((player) => {
                    const done = isPlayerStationComplete(player, entry.metrics, drafts);
                    return (
                      <li key={player.id}>
                        <button
                          type="button"
                          onClick={() => selectSearchPlayer(player)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left text-base text-zinc-100 hover:bg-[#0a1628]"
                        >
                          <span>{playerDisplayName(player)}</span>
                          <span className="text-sm text-[#52B788]">{done ? "ok" : ""}</span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            ) : null}
          </div>

          <div className="space-y-4">
            {filteredPlayers.map((player) => {
              const complete =
                entry && isPlayerStationComplete(player, entry.metrics, drafts);
              return (
                <article
                  key={player.id}
                  className={`rounded-3xl border p-4 ${
                    complete
                      ? "border-[#52B788]/40 bg-[#0b1324]/50"
                      : "border-[#18243a] bg-[#0b1324]/80"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/testing/players/${player.id}`}
                        className="text-lg font-semibold text-zinc-100 hover:text-[#52B788]"
                      >
                        {player.firstName} {player.lastName}
                      </Link>
                      {!player.waiverSignatureId ? (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-300">
                          Needs waiver
                        </span>
                      ) : null}
                    </div>
                    {complete ? (
                      <span className="rounded-full bg-[#22c55e]/15 px-2 py-0.5 text-xs font-semibold text-[#52B788]">
                        Done
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-4">
                    {entry?.metrics.map((metric) => {
                      const draftKey = `${player.id}:${metric.key}`;
                      const draft = drafts[draftKey] ?? emptyDraft();
                      const metricEntry = player.metrics[metric.key];
                      const attempts = parseDraftAttempts(metric, draft);
                      const currentBest = computeBestAttempt(attempts, metric.betterIs);
                      const personalBest = metricEntry?.personalBest ?? null;
                      const isPr =
                        currentBest !== null &&
                        personalBest !== null &&
                        ((metric.betterIs === "LOWER" && currentBest < personalBest) ||
                          (metric.betterIs === "HIGHER" && currentBest > personalBest));

                      return (
                        <div key={metric.key} className="rounded-2xl border border-[#2b3650] p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-zinc-100">{metric.label}</p>
                            {isPr ? (
                              <span className="rounded-full bg-[#22c55e] px-2 py-0.5 text-xs font-bold text-[#0A1628]">
                                PR
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-zinc-500">
                            Last:{" "}
                            {metricEntry?.lastSession
                              ? `${formatMetricValue(metric, metricEntry.lastSession.value)} (${metricEntry.lastSession.date})`
                              : "--"}
                          </p>

                          {metric.inputType === "feet_inches" ? (
                            <div className="mt-3 grid grid-cols-2 gap-3">
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  id={`${player.id}-${metric.key}-a`}
                                  inputMode="numeric"
                                  value={draft.a}
                                  onChange={(event) =>
                                    updateDraft(draftKey, { a: event.target.value })
                                  }
                                  placeholder="ft"
                                  className={`rounded-xl border px-3 py-3 text-xl text-zinc-100 ${
                                    currentBest !== null &&
                                    attempts[0] === currentBest &&
                                    attempts.length > 0
                                      ? "border-[#52B788] bg-[#0a1628]"
                                      : "border-[#2b3650] bg-[#0a1628]"
                                  }`}
                                />
                                <input
                                  id={`${player.id}-${metric.key}-b`}
                                  inputMode="decimal"
                                  value={draft.b}
                                  onChange={(event) =>
                                    updateDraft(draftKey, { b: event.target.value })
                                  }
                                  placeholder="in"
                                  className={`rounded-xl border px-3 py-3 text-xl text-zinc-100 ${
                                    currentBest !== null &&
                                    attempts[0] === currentBest &&
                                    attempts.length > 0
                                      ? "border-[#52B788] bg-[#0a1628]"
                                      : "border-[#2b3650] bg-[#0a1628]"
                                  }`}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  id={`${player.id}-${metric.key}-c`}
                                  inputMode="numeric"
                                  value={draft.c}
                                  onChange={(event) =>
                                    updateDraft(draftKey, { c: event.target.value })
                                  }
                                  placeholder="ft"
                                  className={`rounded-xl border px-3 py-3 text-xl text-zinc-100 ${
                                    currentBest !== null &&
                                    attempts[1] === currentBest &&
                                    attempts.length > 1
                                      ? "border-[#52B788] bg-[#0a1628]"
                                      : "border-[#2b3650] bg-[#0a1628]"
                                  }`}
                                />
                                <input
                                  id={`${player.id}-${metric.key}-d`}
                                  inputMode="decimal"
                                  value={draft.d}
                                  onChange={(event) =>
                                    updateDraft(draftKey, { d: event.target.value })
                                  }
                                  placeholder="in"
                                  className={`rounded-xl border px-3 py-3 text-xl text-zinc-100 ${
                                    currentBest !== null &&
                                    attempts[1] === currentBest &&
                                    attempts.length > 1
                                      ? "border-[#52B788] bg-[#0a1628]"
                                      : "border-[#2b3650] bg-[#0a1628]"
                                  }`}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 grid grid-cols-2 gap-3">
                              {[0, 1].map((index) => (
                                <input
                                  key={index}
                                  id={`${player.id}-${metric.key}-${index === 0 ? "a" : "b"}`}
                                  inputMode="decimal"
                                  value={index === 0 ? draft.a : draft.b}
                                  onChange={(event) =>
                                    updateDraft(draftKey, index === 0 ? { a: event.target.value } : { b: event.target.value })
                                  }
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      event.preventDefault();
                                      void saveMetricRow(player.id, metric);
                                    }
                                  }}
                                  className={`rounded-xl border px-3 py-3 text-xl text-zinc-100 ${
                                    currentBest !== null && attempts[index] === currentBest
                                      ? "border-[#52B788] bg-[#0a1628]"
                                      : "border-[#2b3650] bg-[#0a1628]"
                                  }`}
                                />
                              ))}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => void saveMetricRow(player.id, metric)}
                            className="mt-3 rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-[#0A1628]"
                          >
                            Save
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
