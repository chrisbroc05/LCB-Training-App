/**
 * Maps workout exercise names to Speed & Agility drill library videos.
 * Age gates keep advanced plyos off 8-11 (and weighted skaters off under 15).
 */

import {
  getDrillLibraryVideoById,
  getDrillLibraryVideoId,
} from "@/lib/drill-library-videos";
import type { WorkoutAgeGroup } from "@/lib/workout-program-types";

export const SPEED_AGILITY_DRILL_IDS = {
  pogoHops: "1246662222",
  depthJumps: "1246662433",
  boxSteps: "1246663053",
  depthDropDoubleBroad: "1246663568",
  quickFeetCircuit: "1246663963",
  seatedBoxJumps: "1246663334",
  skaterJumps: "1246664185",
  weightedSkaterJumps: "1246664442",
  tripleBroadJumps: "1246664791",
  speedStartsWithArms: "1246665045",
} as const;

const AGE_RANK: Record<WorkoutAgeGroup, number> = {
  "8-11": 0,
  "12-15": 1,
  "16-18": 2,
};

type ExerciseDrillRule = {
  vimeoId: string;
  /** Match against a simplified lowercase exercise name. */
  pattern: RegExp;
  minAge?: WorkoutAgeGroup;
  maxAge?: WorkoutAgeGroup;
  /**
   * When true, a pattern match that fails the age gate returns null
   * instead of falling through to a weaker rule (e.g. stair-drop vs broad jump).
   */
  exclusive?: boolean;
};

/**
 * More-specific patterns first. "Box Drill" deliberately does not match box jump/step rules.
 */
const EXERCISE_DRILL_RULES: ExerciseDrillRule[] = [
  {
    vimeoId: SPEED_AGILITY_DRILL_IDS.weightedSkaterJumps,
    pattern: /\bweighted\s+skater/,
    minAge: "16-18",
    exclusive: true,
  },
  {
    vimeoId: SPEED_AGILITY_DRILL_IDS.skaterJumps,
    pattern: /\bskater\b/,
  },
  {
    vimeoId: SPEED_AGILITY_DRILL_IDS.pogoHops,
    pattern: /\bpogo\b/,
  },
  {
    vimeoId: SPEED_AGILITY_DRILL_IDS.depthDropDoubleBroad,
    pattern: /\b(depth\s+drop|stair\s+drop\s+to\s+broad)/,
    minAge: "12-15",
    exclusive: true,
  },
  {
    vimeoId: SPEED_AGILITY_DRILL_IDS.depthJumps,
    pattern: /\b(depth\s+jump|stair\s+drop)/,
    minAge: "12-15",
    exclusive: true,
  },
  {
    vimeoId: SPEED_AGILITY_DRILL_IDS.boxSteps,
    pattern: /\bbox\s+steps?\b/,
  },
  {
    vimeoId: SPEED_AGILITY_DRILL_IDS.seatedBoxJumps,
    pattern: /\b(seated\s+box\s+jump|box\s+jump)\b/,
  },
  {
    vimeoId: SPEED_AGILITY_DRILL_IDS.quickFeetCircuit,
    pattern: /\b(quick\s+feet|ladder)\b/,
  },
  {
    vimeoId: SPEED_AGILITY_DRILL_IDS.tripleBroadJumps,
    pattern: /\bbroad\s+jump/,
  },
  {
    vimeoId: SPEED_AGILITY_DRILL_IDS.speedStartsWithArms,
    pattern:
      /\b(wall\s+drill|acceleration\s+sprint|first[-\s]?step|forward\s+sprint|flying\s+sprint|speed\s+starts?)\b/,
  },
];

function normalizeExerciseName(name: string) {
  return name
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ageAllowed(
  ageGroup: WorkoutAgeGroup,
  minAge: WorkoutAgeGroup | undefined,
  maxAge: WorkoutAgeGroup | undefined,
) {
  const rank = AGE_RANK[ageGroup];
  if (minAge && rank < AGE_RANK[minAge]) {
    return false;
  }
  if (maxAge && rank > AGE_RANK[maxAge]) {
    return false;
  }
  return true;
}

export function resolveExerciseDrillVimeoId(
  exerciseName: string,
  ageGroup: WorkoutAgeGroup,
): string | null {
  const normalized = normalizeExerciseName(exerciseName);
  for (const rule of EXERCISE_DRILL_RULES) {
    if (!rule.pattern.test(normalized)) {
      continue;
    }
    if (!ageAllowed(ageGroup, rule.minAge, rule.maxAge)) {
      if (rule.exclusive) {
        return null;
      }
      continue;
    }
    return rule.vimeoId;
  }
  return null;
}

export function resolveExerciseDrillLink(exerciseName: string, ageGroup: WorkoutAgeGroup) {
  const vimeoId = resolveExerciseDrillVimeoId(exerciseName, ageGroup);
  if (!vimeoId) {
    return null;
  }
  const video = getDrillLibraryVideoById(vimeoId);
  if (!video) {
    return null;
  }
  return {
    vimeoId,
    title: video.title,
    href: `/drill-library?drill=${vimeoId}`,
  };
}

/** Sprint focus daily task always pairs with Speed Starts With the Arms. */
export function getSprintFocusDrillRef() {
  const video = getDrillLibraryVideoById(SPEED_AGILITY_DRILL_IDS.speedStartsWithArms);
  const vimeoId = video ? getDrillLibraryVideoId(video) : null;
  if (!video || !vimeoId) {
    return [];
  }
  return [
    {
      title: video.title,
      vimeoId,
      href: `/drill-library?drill=${vimeoId}`,
    },
  ];
}

export type ExerciseDrillLinkReportRow = {
  ageGroup: WorkoutAgeGroup;
  source: "speed_agility" | "strength" | "home_strength";
  exerciseName: string;
  drillTitle: string;
  vimeoId: string;
};

/**
 * Builds the concrete exercise -> drill link list across workout sources (for review).
 */
export function listExerciseDrillLinks(params: {
  speedAgilityExercises: Array<{ ageGroup: WorkoutAgeGroup; name: string }>;
  strengthExercises: Array<{ ageGroup: WorkoutAgeGroup; name: string }>;
  homeStrengthExercises: Array<{ ageGroup: WorkoutAgeGroup; name: string }>;
}): ExerciseDrillLinkReportRow[] {
  const rows: ExerciseDrillLinkReportRow[] = [];
  const seen = new Set<string>();

  const push = (
    source: ExerciseDrillLinkReportRow["source"],
    ageGroup: WorkoutAgeGroup,
    exerciseName: string,
  ) => {
    const link = resolveExerciseDrillLink(exerciseName, ageGroup);
    if (!link) {
      return;
    }
    const key = `${source}|${ageGroup}|${exerciseName}|${link.vimeoId}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    rows.push({
      ageGroup,
      source,
      exerciseName,
      drillTitle: link.title,
      vimeoId: link.vimeoId,
    });
  };

  for (const row of params.speedAgilityExercises) {
    push("speed_agility", row.ageGroup, row.name);
  }
  for (const row of params.strengthExercises) {
    push("strength", row.ageGroup, row.name);
  }
  for (const row of params.homeStrengthExercises) {
    push("home_strength", row.ageGroup, row.name);
  }

  return rows.sort((a, b) => {
    const age = AGE_RANK[a.ageGroup] - AGE_RANK[b.ageGroup];
    if (age !== 0) {
      return age;
    }
    const source = a.source.localeCompare(b.source);
    if (source !== 0) {
      return source;
    }
    return a.exerciseName.localeCompare(b.exerciseName);
  });
}
