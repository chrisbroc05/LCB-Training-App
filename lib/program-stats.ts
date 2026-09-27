export type GameStatInput = {
  atBats: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  walks: number;
  hitByPitch: number;
  runs: number;
  rbis: number;
  strikeouts: number;
  stolenBases: number;
  errors: number;
};

export type GameStatTotals = GameStatInput & {
  games: number;
};

export const EMPTY_GAME_STATS: GameStatInput = {
  atBats: 0,
  hits: 0,
  doubles: 0,
  triples: 0,
  homeRuns: 0,
  walks: 0,
  hitByPitch: 0,
  runs: 0,
  rbis: 0,
  strikeouts: 0,
  stolenBases: 0,
  errors: 0,
};

const STAT_FIELDS: Array<keyof GameStatInput> = [
  "atBats",
  "hits",
  "doubles",
  "triples",
  "homeRuns",
  "walks",
  "hitByPitch",
  "runs",
  "rbis",
  "strikeouts",
  "stolenBases",
  "errors",
];

export { validateDayLogNote } from "@/lib/program-note-shared";

export function validateGameStats(stats: GameStatInput) {
  for (const field of STAT_FIELDS) {
    const value = stats[field];
    if (!Number.isInteger(value) || value < 0 || value > 20) {
      return { ok: false as const, error: `${field} must be between 0 and 20.` };
    }
  }

  if (stats.hits > stats.atBats) {
    return { ok: false as const, error: "Hits cannot exceed at-bats." };
  }

  if (stats.doubles + stats.triples + stats.homeRuns > stats.hits) {
    return {
      ok: false as const,
      error: "Doubles, triples, and home runs cannot exceed hits.",
    };
  }

  if (stats.strikeouts > stats.atBats) {
    return { ok: false as const, error: "Strikeouts cannot exceed at-bats." };
  }

  return { ok: true as const };
}

export function aggregateGameStats(games: GameStatInput[]): GameStatTotals {
  const totals = { ...EMPTY_GAME_STATS, games: games.length };

  for (const game of games) {
    for (const field of STAT_FIELDS) {
      totals[field] += game[field];
    }
  }

  return totals;
}

export function computeAvg(totals: Pick<GameStatInput, "hits" | "atBats">) {
  if (totals.atBats <= 0) {
    return 0;
  }
  return totals.hits / totals.atBats;
}

export function computeObp(
  totals: Pick<GameStatInput, "hits" | "walks" | "hitByPitch" | "atBats">,
) {
  const denominator = totals.atBats + totals.walks + totals.hitByPitch;
  if (denominator <= 0) {
    return 0;
  }
  return (totals.hits + totals.walks + totals.hitByPitch) / denominator;
}

export function computeSlg(
  totals: Pick<GameStatInput, "hits" | "doubles" | "triples" | "homeRuns" | "atBats">,
) {
  if (totals.atBats <= 0) {
    return 0;
  }
  const totalBases =
    totals.hits + totals.doubles + totals.triples * 2 + totals.homeRuns * 3;
  return totalBases / totals.atBats;
}

export function formatRate(rate: number) {
  if (rate <= 0) {
    return ".000";
  }
  const formatted = rate.toFixed(3);
  return formatted.startsWith("0.") ? formatted.slice(1) : formatted;
}

export function formatGameLine(stats: GameStatInput) {
  const parts: string[] = [`${stats.hits} for ${stats.atBats}`];

  if (stats.doubles > 0) {
    parts.push(`${stats.doubles} 2B`);
  }
  if (stats.triples > 0) {
    parts.push(`${stats.triples} 3B`);
  }
  if (stats.homeRuns > 0) {
    parts.push(`${stats.homeRuns} HR`);
  }
  if (stats.walks > 0) {
    parts.push(`${stats.walks} BB`);
  }
  if (stats.hitByPitch > 0) {
    parts.push(`${stats.hitByPitch} HBP`);
  }
  if (stats.runs > 0) {
    parts.push(`${stats.runs} R`);
  }
  if (stats.rbis > 0) {
    parts.push(`${stats.rbis} RBI`);
  }
  if (stats.strikeouts > 0) {
    parts.push(`${stats.strikeouts} K`);
  }
  if (stats.stolenBases > 0) {
    parts.push(`${stats.stolenBases} SB`);
  }
  if (stats.errors > 0) {
    parts.push(`${stats.errors} E`);
  }

  return parts.join(", ");
}

export function formatGameSummary(stats: GameStatInput, opponent?: string | null) {
  const line = formatGameLine(stats);
  if (opponent?.trim()) {
    return `Game vs ${opponent.trim()}: ${line}`;
  }
  return `Game: ${line}`;
}
