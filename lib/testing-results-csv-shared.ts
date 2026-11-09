import type { TestBetterIs, TestMetricInputType } from "@/lib/testing-shared";
import { parseCsvText } from "@/lib/testing-shared";

export const RESULTS_CSV_IDENTITY_COLUMNS = [
  "team",
  "test_date",
  "first_name",
  "last_name",
] as const;

export type ResultsCsvMetricColumn =
  | "ten_yard_sec"
  | "thirty_yard_sec"
  | "sixty_yard_sec"
  | "shuttle_5_10_5_sec"
  | "broad_jump_in"
  | "exit_velo_mph"
  | "pulldown_velo_mph";

export type ResultsCsvMetricDefinition = {
  csvColumn: ResultsCsvMetricColumn;
  metricKey: string;
  label: string;
  unit: string;
  decimals: number;
  betterIs: TestBetterIs;
  category: string;
  inputType: TestMetricInputType;
  sortOrder: number;
  stationKey: string;
  stationLabel: string;
  stationSortOrder: number;
};

/** Fixed mapping from CSV metric columns to testing metrics / stations. */
export const RESULTS_CSV_METRIC_DEFINITIONS: ResultsCsvMetricDefinition[] = [
  {
    csvColumn: "ten_yard_sec",
    metricKey: "ten_yard",
    label: "10-Yard Sprint",
    unit: "sec",
    decimals: 2,
    betterIs: "LOWER",
    category: "speed",
    inputType: "number",
    sortOrder: 10,
    stationKey: "speed_power",
    stationLabel: "Speed and Power",
    stationSortOrder: 10,
  },
  {
    csvColumn: "thirty_yard_sec",
    metricKey: "thirty_yard",
    label: "30-Yard Sprint",
    unit: "sec",
    decimals: 2,
    betterIs: "LOWER",
    category: "speed",
    inputType: "number",
    sortOrder: 15,
    stationKey: "speed_power",
    stationLabel: "Speed and Power",
    stationSortOrder: 10,
  },
  {
    csvColumn: "sixty_yard_sec",
    metricKey: "sixty_yard",
    label: "60-Yard Dash",
    unit: "sec",
    decimals: 2,
    betterIs: "LOWER",
    category: "speed",
    inputType: "number",
    sortOrder: 20,
    stationKey: "speed_power",
    stationLabel: "Speed and Power",
    stationSortOrder: 10,
  },
  {
    csvColumn: "shuttle_5_10_5_sec",
    metricKey: "pro_agility",
    label: "5-10-5 Pro Agility",
    unit: "sec",
    decimals: 2,
    betterIs: "LOWER",
    category: "agility",
    inputType: "number",
    sortOrder: 40,
    stationKey: "speed_power",
    stationLabel: "Speed and Power",
    stationSortOrder: 10,
  },
  {
    csvColumn: "broad_jump_in",
    metricKey: "broad_jump",
    label: "Broad Jump",
    unit: "in",
    decimals: 0,
    betterIs: "HIGHER",
    category: "power",
    inputType: "feet_inches",
    sortOrder: 50,
    stationKey: "speed_power",
    stationLabel: "Speed and Power",
    stationSortOrder: 10,
  },
  {
    csvColumn: "exit_velo_mph",
    metricKey: "exit_velo_tee",
    label: "Exit Velo (Tee)",
    unit: "mph",
    decimals: 1,
    betterIs: "HIGHER",
    category: "hitting",
    inputType: "number",
    sortOrder: 80,
    stationKey: "hitting",
    stationLabel: "Hitting",
    stationSortOrder: 20,
  },
  {
    csvColumn: "pulldown_velo_mph",
    metricKey: "pulldown_velo",
    label: "Pulldown Velo",
    unit: "mph",
    decimals: 1,
    betterIs: "HIGHER",
    category: "throwing",
    inputType: "number",
    sortOrder: 95,
    stationKey: "throwing",
    stationLabel: "Throwing",
    stationSortOrder: 30,
  },
];

export const RESULTS_CSV_REQUIRED_HEADERS = [
  ...RESULTS_CSV_IDENTITY_COLUMNS,
  ...RESULTS_CSV_METRIC_DEFINITIONS.map((definition) => definition.csvColumn),
] as const;

export type ResultsCsvParsedRow = {
  rowIndex: number;
  teamName: string;
  testDate: string;
  firstName: string;
  lastName: string;
  metrics: Partial<Record<ResultsCsvMetricColumn, number>>;
};

export type ResultsCsvParseSuccess = {
  ok: true;
  rows: ResultsCsvParsedRow[];
  teamNames: string[];
};

export type ResultsCsvParseFailure = {
  ok: false;
  error: string;
};

export type ResultsCsvImportMappingStatus = ResultsCsvMetricDefinition & {
  exists: boolean;
};

export type ResultsCsvImportPreviewValue = {
  csvColumn: string;
  metricKey: string;
  label: string;
  newValue: number;
  existingValue: number | null;
};

export type ResultsCsvImportPreviewRow = {
  rowIndex: number;
  teamName: string;
  teamId: string;
  testDate: string;
  firstName: string;
  lastName: string;
  playerStatus: "existing" | "create";
  playerId: string | null;
  values: ResultsCsvImportPreviewValue[];
};

export type ResultsCsvImportPreview =
  | {
      ok: true;
      mappings: ResultsCsvImportMappingStatus[];
      metricsToCreate: ResultsCsvImportMappingStatus[];
      playersToCreate: Array<{
        teamName: string;
        firstName: string;
        lastName: string;
      }>;
      rows: ResultsCsvImportPreviewRow[];
      resultCreateCount: number;
      resultUpdateCount: number;
    }
  | {
      ok: false;
      error: string;
    };

export type ResultsCsvImportCommitResult =
  | {
      ok: true;
      playersCreated: number;
      metricsCreated: number;
      resultsUpserted: number;
      sessionsTouched: number;
    }
  | {
      ok: false;
      error: string;
    };

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function parseResultsCsvTestDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(`${trimmed}T12:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return trimmed;
  }

  const mdy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const month = Number(mdy[1]);
    const day = Number(mdy[2]);
    const year = Number(mdy[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }
    const iso = `${year}-${pad2(month)}-${pad2(day)}`;
    const date = new Date(`${iso}T12:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return iso;
  }

  return null;
}

export function parseResultsCsvMetricValue(raw: string): { ok: true; value: number | null } | { ok: false } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: true, value: null };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return { ok: false };
  }
  return { ok: true, value };
}

export function parseResultsCsvText(csvText: string): ResultsCsvParseSuccess | ResultsCsvParseFailure {
  const { headers, rows } = parseCsvText(csvText);
  if (headers.length === 0) {
    return { ok: false, error: "CSV is empty." };
  }

  const headerSet = new Set(headers.map((header) => header.trim()));
  const missing = RESULTS_CSV_REQUIRED_HEADERS.filter((header) => !headerSet.has(header));
  if (missing.length > 0) {
    return {
      ok: false,
      error: `CSV is missing required columns: ${missing.join(", ")}.`,
    };
  }

  const indexByHeader = new Map(headers.map((header, index) => [header.trim(), index]));
  const parsedRows: ResultsCsvParsedRow[] = [];
  const teamNames = new Set<string>();

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const cells = rows[rowIndex];
    const get = (header: string) => {
      const index = indexByHeader.get(header);
      return index === undefined ? "" : (cells[index] ?? "");
    };

    const teamName = get("team").trim();
    const firstName = get("first_name").trim();
    const lastName = get("last_name").trim();
    const testDateRaw = get("test_date");
    const testDate = parseResultsCsvTestDate(testDateRaw);
    // Optional legacy "jersey" column is ignored if present.

    if (!teamName && !firstName && !lastName && !testDateRaw.trim()) {
      continue;
    }

    if (!teamName || !firstName || !lastName) {
      return {
        ok: false,
        error: `Row ${rowIndex + 2}: team, first_name, and last_name are required.`,
      };
    }
    if (!testDate) {
      return {
        ok: false,
        error: `Row ${rowIndex + 2}: invalid test_date "${testDateRaw.trim()}". Use YYYY-MM-DD or M/D/YYYY.`,
      };
    }

    const metrics: Partial<Record<ResultsCsvMetricColumn, number>> = {};
    for (const definition of RESULTS_CSV_METRIC_DEFINITIONS) {
      const metricParsed = parseResultsCsvMetricValue(get(definition.csvColumn));
      if (!metricParsed.ok) {
        return {
          ok: false,
          error: `Row ${rowIndex + 2}: invalid value for ${definition.csvColumn}.`,
        };
      }
      if (metricParsed.value !== null) {
        metrics[definition.csvColumn] = metricParsed.value;
      }
    }

    teamNames.add(teamName);
    parsedRows.push({
      rowIndex,
      teamName,
      testDate,
      firstName,
      lastName,
      metrics,
    });
  }

  if (parsedRows.length === 0) {
    return { ok: false, error: "CSV has no data rows." };
  }

  return {
    ok: true,
    rows: parsedRows,
    teamNames: Array.from(teamNames).sort((a, b) => a.localeCompare(b)),
  };
}
