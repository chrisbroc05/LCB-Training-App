import { parseCsvText } from "@/lib/testing-shared";
import {
  isDailyChallengeAgeGroup,
  parseDailyChallengeAgeGroupLabel,
  type DailyChallengeAgeGroupKey,
  type DailyQuestionTypeKey,
} from "@/lib/daily-challenge-shared";

export type DailyChallengeCsvChallengeRow = {
  kind: "challenge";
  ageGroup: DailyChallengeAgeGroupKey;
  rotationDay: number;
  title: string;
  instructions: string;
  drillLibraryVimeoId: string | null;
  active: boolean;
  lineNumber: number;
};

export type DailyChallengeCsvQuestionRow = {
  kind: "question";
  ageGroup: DailyChallengeAgeGroupKey | null;
  rotationDay: number;
  type: DailyQuestionTypeKey;
  prompt: string;
  options: string[];
  correctOptionIndex: number | null;
  explanation: string | null;
  active: boolean;
  lineNumber: number;
};

export type DailyChallengeCsvPreview =
  | {
      ok: true;
      challenges: DailyChallengeCsvChallengeRow[];
      questions: DailyChallengeCsvQuestionRow[];
      warnings: string[];
    }
  | { ok: false; error: string };

function parseBool(raw: string | undefined, fallback = true) {
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  const value = raw.trim().toLowerCase();
  if (["1", "true", "yes", "y"].includes(value)) {
    return true;
  }
  if (["0", "false", "no", "n"].includes(value)) {
    return false;
  }
  return null;
}

function headerMap(headers: string[]) {
  const map = new Map<string, number>();
  headers.forEach((header, index) => {
    map.set(header.trim().toLowerCase().replace(/\s+/g, "_"), index);
  });
  return map;
}

function cell(row: string[], map: Map<string, number>, key: string) {
  const index = map.get(key);
  if (index === undefined) {
    return "";
  }
  return row[index]?.trim() ?? "";
}

function parseAgeGroupCell(raw: string): DailyChallengeAgeGroupKey | null | "invalid" {
  if (!raw || raw.toLowerCase() === "all") {
    return null;
  }
  if (isDailyChallengeAgeGroup(raw.toUpperCase().replace(/-/g, "_"))) {
    return raw.toUpperCase().replace(/-/g, "_") as DailyChallengeAgeGroupKey;
  }
  const parsed = parseDailyChallengeAgeGroupLabel(raw);
  return parsed ?? "invalid";
}

export function previewDailyChallengeCsv(csvText: string): DailyChallengeCsvPreview {
  const { headers, rows } = parseCsvText(csvText);
  if (headers.length === 0) {
    return { ok: false, error: "CSV is empty." };
  }

  const map = headerMap(headers);
  const kindKey = map.has("kind") ? "kind" : map.has("type_row") ? "type_row" : null;
  if (!kindKey || !map.has("rotation_day") || !map.has("title_or_prompt")) {
    return {
      ok: false,
      error:
        "CSV needs columns: kind (challenge|question), age_group, rotation_day, title_or_prompt. For questions also: question_type, option_1..option_4, correct_option (1-based), explanation.",
    };
  }

  const challenges: DailyChallengeCsvChallengeRow[] = [];
  const questions: DailyChallengeCsvQuestionRow[] = [];
  const warnings: string[] = [];

  rows.forEach((row, index) => {
    const lineNumber = index + 2;
    if (row.every((value) => !value.trim())) {
      return;
    }

    const kindRaw = cell(row, map, kindKey).toLowerCase();
    const rotationDay = Number.parseInt(cell(row, map, "rotation_day"), 10);
    const titleOrPrompt = cell(row, map, "title_or_prompt");
    const activeParsed = parseBool(cell(row, map, "active"), true);
    if (activeParsed === null) {
      warnings.push(`Line ${lineNumber}: invalid active flag, defaulting to true.`);
    }
    const active = activeParsed ?? true;

    if (!Number.isInteger(rotationDay) || rotationDay < 1) {
      warnings.push(`Line ${lineNumber}: skipped - rotation_day must be an integer >= 1.`);
      return;
    }
    if (!titleOrPrompt) {
      warnings.push(`Line ${lineNumber}: skipped - title_or_prompt is required.`);
      return;
    }

    if (kindRaw === "challenge") {
      const ageParsed = parseAgeGroupCell(cell(row, map, "age_group"));
      if (ageParsed === "invalid" || ageParsed === null) {
        warnings.push(`Line ${lineNumber}: skipped - challenge needs age_group 8-11, 12-14, or 15+.`);
        return;
      }
      challenges.push({
        kind: "challenge",
        ageGroup: ageParsed,
        rotationDay,
        title: titleOrPrompt,
        instructions: cell(row, map, "instructions") || titleOrPrompt,
        drillLibraryVimeoId: cell(row, map, "drill_library_vimeo_id") || null,
        active,
        lineNumber,
      });
      return;
    }

    if (kindRaw === "question") {
      const typeRaw = cell(row, map, "question_type").toUpperCase();
      if (typeRaw !== "TRIVIA" && typeRaw !== "MINDSET") {
        warnings.push(`Line ${lineNumber}: skipped - question_type must be TRIVIA or MINDSET.`);
        return;
      }
      const ageParsed = parseAgeGroupCell(cell(row, map, "age_group"));
      if (ageParsed === "invalid") {
        warnings.push(`Line ${lineNumber}: skipped - invalid age_group (use 8-11, 12-14, 15+, or all).`);
        return;
      }

      if (typeRaw === "MINDSET") {
        questions.push({
          kind: "question",
          ageGroup: ageParsed,
          rotationDay,
          type: "MINDSET",
          prompt: titleOrPrompt,
          options: [],
          correctOptionIndex: null,
          explanation: null,
          active,
          lineNumber,
        });
        return;
      }

      const options = [1, 2, 3, 4]
        .map((n) => cell(row, map, `option_${n}`))
        .filter(Boolean);
      if (options.length < 2 || options.length > 4) {
        warnings.push(`Line ${lineNumber}: skipped - trivia needs 2-4 options.`);
        return;
      }
      const correctRaw = cell(row, map, "correct_option");
      const correctOneBased = Number.parseInt(correctRaw, 10);
      if (!Number.isInteger(correctOneBased) || correctOneBased < 1 || correctOneBased > options.length) {
        warnings.push(`Line ${lineNumber}: skipped - correct_option must be 1..${options.length}.`);
        return;
      }
      questions.push({
        kind: "question",
        ageGroup: ageParsed,
        rotationDay,
        type: "TRIVIA",
        prompt: titleOrPrompt,
        options,
        correctOptionIndex: correctOneBased - 1,
        explanation: cell(row, map, "explanation") || null,
        active,
        lineNumber,
      });
      return;
    }

    warnings.push(`Line ${lineNumber}: skipped - kind must be challenge or question.`);
  });

  if (challenges.length === 0 && questions.length === 0) {
    return { ok: false, error: "No valid challenge or question rows found." };
  }

  return { ok: true, challenges, questions, warnings };
}
