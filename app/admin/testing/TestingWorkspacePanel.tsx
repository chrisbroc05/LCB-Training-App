"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  computeBestAttempt,
  feetInchesToInches,
  formatMetricValue,
  inchesToFeetInches,
  MAX_TEST_ATTEMPTS,
  type TestMetricRecord,
  type TestPlayerSummary,
  type TestResultRecord,
  type TestSessionSummary,
  type TestStationRecord,
  type TestTeamOption,
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
    teamId: string;
    teamSlug: string;
    teamName: string;
    date: string;
    label: string;
  };
  stationKey: string;
  metrics: TestMetricRecord[];
  players: EntryPlayer[];
};

type WorkspaceData = {
  team: { id: string; name: string; teamSlug: string };
  players: TestPlayerSummary[];
  session: TestSessionSummary;
  sessions: TestSessionSummary[];
  stations: TestStationRecord[];
};

type SyncState = "saved" | "waiting" | "syncing";

type DraftSlot = { a: string; b: string; c: string; d: string };

function todayIso() {
  return new Date().toISOString().slice(0, 10);
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
  const [teamOptions, setTeamOptions] = useState<TestTeamOption[]>([]);
  const [teamSlug, setTeamSlug] = useState("");
  const [date, setDate] = useState(todayIso());
  const [stationKey, setStationKey] = useState("speed_power");
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
  const [syncState, setSyncState] = useState<SyncState>("saved");
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadTeamOptions = useCallback(async () => {
    const response = await fetch("/api/admin/testing/teams", { cache: "no-store" });
    const data = (await response.json()) as { teams?: TestTeamOption[] };
    const teams = data.teams ?? [];
    setTeamOptions(teams);
    setTeamSlug((current) => current || teams[0]?.teamSlug || "");
  }, []);

  const loadWorkspace = useCallback(async () => {
    if (!teamSlug) {
      return;
    }
    const response = await fetch(
      `/api/admin/testing/workspace?teamSlug=${encodeURIComponent(teamSlug)}&date=${encodeURIComponent(date)}`,
      { cache: "no-store" },
    );
    const data = (await response.json()) as WorkspaceData & { error?: string };
    if (!response.ok) {
      throw new Error(data.error ?? "Failed to load team.");
    }
    setWorkspace(data);
  }, [teamSlug, date]);

  const loadEntry = useCallback(async () => {
    if (!teamSlug || !stationKey) {
      return;
    }
    const response = await fetch(
      `/api/admin/testing/entry?teamSlug=${encodeURIComponent(teamSlug)}&date=${encodeURIComponent(date)}&stationKey=${encodeURIComponent(stationKey)}`,
      { cache: "no-store" },
    );
    const data = (await response.json()) as EntryData & { error?: string };
    if (!response.ok) {
      throw new Error(data.error ?? "Failed to load entry data.");
    }
    setEntry(data);
    const nextDrafts: Record<string, DraftSlot> = {};
    for (const player of data.players) {
      for (const metric of data.metrics) {
        const key = `${player.id}:${metric.key}`;
        nextDrafts[key] = draftFromResult(metric, player.metrics[metric.key]?.result ?? null);
      }
    }
    setDrafts(nextDrafts);
  }, [teamSlug, date, stationKey]);

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
    if (!teamSlug) {
      return;
    }
    void loadWorkspace().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Failed to load workspace.");
    });
  }, [loadWorkspace, teamSlug]);

  useEffect(() => {
    if (!teamSlug) {
      return;
    }
    void loadEntry().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Failed to load entry.");
    });
  }, [loadEntry, teamSlug]);

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
    const response = await fetch("/api/admin/testing/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTeamName.trim() }),
    });
    const data = (await response.json()) as { team?: TestTeamOption; error?: string };
    if (!response.ok || !data.team) {
      setError(data.error ?? "Failed to create team.");
      return;
    }
    setNewTeamName("");
    setShowNewTeam(false);
    setTeamSlug(data.team.teamSlug);
    await loadTeamOptions();
  }

  async function addPlayer() {
    if (!workspace?.team.id) {
      return;
    }
    const response = await fetch(`/api/admin/testing/teams/${workspace.team.id}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: addFirst,
        lastName: addLast,
        age: addAge ? Number(addAge) : null,
      }),
    });
    const data = (await response.json()) as { player?: TestPlayerSummary; error?: string };
    if (!response.ok || !data.player) {
      setError(data.error ?? "Failed to add player.");
      return;
    }
    setAddFirst("");
    setAddLast("");
    setAddAge("");
    setShowAddPlayer(false);
    pendingFocusPlayerId.current = data.player.id;
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
      const response = await fetch(`/api/admin/testing/sessions/${entry.session.id}/results`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          metricKey: metric.key,
          attempts,
        }),
      });
      if (!response.ok) {
        throw new Error("Network save failed.");
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
            href="/admin/testing/metrics"
            className="rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-zinc-300"
          >
            Metrics
          </Link>
          {entry ? (
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

      <div className="grid gap-3 sm:grid-cols-2">
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

      {teamSlug ? (
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
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
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
