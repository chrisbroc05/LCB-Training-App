export type TestBetterIs = "LOWER" | "HIGHER";

export type TestMetricInputType = "number" | "feet_inches";

export type TestMetricRecord = {
  key: string;
  label: string;
  unit: string;
  decimals: number;
  betterIs: TestBetterIs;
  category: string;
  active: boolean;
  sortOrder: number;
  inputType: TestMetricInputType;
};

export const MAX_TEST_ATTEMPTS = 2;

export type TestTeamOption = {
  teamSlug: string;
  name: string;
  teamId: string | null;
};

export type TestStationRecord = {
  key: string;
  label: string;
  sortOrder: number;
  active: boolean;
  metricKeys: string[];
};

export type TestTeamSummary = {
  id: string;
  name: string;
  teamSlug: string;
  season: string;
  coachName: string;
  coachEmail: string | null;
  archived: boolean;
  createdAt: string;
  playerCount: number;
  lastSessionDate: string | null;
  lastSessionLabel: string | null;
};

export type TestPlayerSummary = {
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
  createdAt: string;
};

export type TestSessionSummary = {
  id: string;
  teamId: string;
  date: string;
  label: string;
  notes: string | null;
  resultCount: number;
};

export type TestResultRecord = {
  id: string;
  sessionId: string;
  playerId: string;
  metricKey: string;
  attempts: number[];
  best: number | null;
  absent: boolean;
  skipped: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export const METRICS_EXCLUDED_FROM_RANKINGS = new Set(["weight"]);

export function normalizePersonName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function buildPlayerDisplayName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

const CLAIM_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function buildClaimCodePrefix(teamName: string) {
  const letters = teamName.replace(/[^a-zA-Z]/g, "").toUpperCase();
  return (letters.slice(0, 3) || "LCB").padEnd(3, "X");
}

export function generateClaimCodeSuffix(length = 4) {
  let suffix = "";
  for (let index = 0; index < length; index += 1) {
    suffix += CLAIM_ALPHABET[Math.floor(Math.random() * CLAIM_ALPHABET.length)];
  }
  return suffix;
}

export function buildClaimCode(teamName: string) {
  return `${buildClaimCodePrefix(teamName)}-${generateClaimCodeSuffix()}`;
}

export function computeBestAttempt(
  attempts: number[],
  betterIs: TestBetterIs,
): number | null {
  const valid = attempts.filter((value) => Number.isFinite(value));
  if (valid.length === 0) {
    return null;
  }
  return betterIs === "LOWER" ? Math.min(...valid) : Math.max(...valid);
}

export function feetInchesToInches(feet: number, inches: number) {
  if (!Number.isFinite(feet) || !Number.isFinite(inches)) {
    return null;
  }
  return feet * 12 + inches;
}

export function inchesToFeetInches(totalInches: number) {
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches - feet * 12;
  return { feet, inches };
}

export function formatMetricValue(
  metric: Pick<TestMetricRecord, "decimals" | "unit" | "inputType">,
  value: number | null,
) {
  if (value === null || !Number.isFinite(value)) {
    return "--";
  }
  if (metric.inputType === "feet_inches") {
    const { feet, inches } = inchesToFeetInches(value);
    return `${feet}' ${inches.toFixed(0)}"`;
  }
  const formatted = value.toFixed(metric.decimals);
  if (metric.unit === "sec") {
    return `${formatted}s`;
  }
  return `${formatted} ${metric.unit}`;
}

export function parseNumericInput(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current.trim());
  return cells;
}

export function parseCsvText(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return { headers: [] as string[], rows: [] as string[][] };
  }
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(parseCsvLine);
  return { headers, rows };
}

export function splitPlayerName(raw: string) {
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export type CsvImportPreviewRow = {
  rowIndex: number;
  playerName: string;
  firstName: string;
  lastName: string;
  age: number | null;
  metrics: Record<string, number | null>;
  matchPlayerId: string | null;
  matchLabel: "existing" | "new";
};

export type CsvImportPreview = {
  headers: string[];
  rows: CsvImportPreviewRow[];
};
