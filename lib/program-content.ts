import type { ProgramAgeGroup, ProgramEquipmentOption } from "@/lib/program-enrollment-shared";
import type { ProgramPhase } from "@/lib/program-schedule";

export type ProgramContentPhase = "foundation" | "build" | "compete";

export type ProgramHittingEquipmentKey = "cage_field" | "tee_net" | "always";
export type ProgramFieldingEquipmentKey = "glove_wall" | "cage_field" | "always";

export const PROGRAM_PHASE_LABELS: Record<ProgramPhase, string> = {
  FOUNDATION: "Foundation",
  BUILD: "Build",
  COMPETE: "Compete",
};

export const HITTING_SWINGS_BY_AGE_PHASE: Record<
  ProgramAgeGroup,
  Record<ProgramContentPhase, number>
> = {
  AGE_8_11: { foundation: 30, build: 45, compete: 60 },
  AGE_12_15: { foundation: 45, build: 70, compete: 90 },
  AGE_16_18: { foundation: 60, build: 90, compete: 100 },
};

export const FIELDING_REPS_BY_AGE_PHASE: Record<
  ProgramAgeGroup,
  Record<ProgramContentPhase, number>
> = {
  AGE_8_11: { foundation: 40, build: 60, compete: 75 },
  AGE_12_15: { foundation: 60, build: 80, compete: 100 },
  AGE_16_18: { foundation: 75, build: 100, compete: 100 },
};

export const HITTING_FOCUS_CUES: Record<number, string> = {
  1: "Stance and balance",
  2: "Load and timing",
  3: "Staying on the back side",
  4: "Swing path through the middle",
  5: "Inside pitch",
  6: "Outside pitch, going the other way",
  7: "Hard line drives",
  8: "Two-strike approach",
  9: "Timing against velocity",
  10: "Situational hitting (runner on 3rd, move the runner)",
  11: "Approach by count",
  12: "Game at-bats: every rep is a count and a situation",
};

export const HITTING_IDEAS_BY_EQUIPMENT: Record<ProgramHittingEquipmentKey, string> = {
  cage_field: "Mix tee, flips and machine or live arm however you want.",
  tee_net: "All reps off the tee, same focus.",
  always: "No setup? Dry swings, mirror work, or PVC pipe swings. Same number, slow and focused on the cue.",
};

export const FIELDING_EMPHASIS_BY_PHASE: Record<
  ProgramContentPhase,
  { summary: string; example: string }
> = {
  foundation: {
    summary: "On your knees at the wall. Short hops straight on, then forehand and backhand.",
    example: "Example: 20 straight, 20 forehand, 20 backhand.",
  },
  build: {
    summary: "Standing. Footwork and two-ball transfers.",
    example: "Example: half standing short hops, half two-ball transfers.",
  },
  compete: {
    summary: "Game speed. Ground balls with a throw to a target.",
    example: "Example: half with a throw.",
  },
};

export const FIELDING_FOOTWORK_LINE = "Footwork and timing on every rep.";

export const FIELDING_IDEAS_BY_EQUIPMENT: Record<ProgramFieldingEquipmentKey, string> = {
  glove_wall: "Tennis ball wall work.",
  cage_field: "Live ground balls or fly balls with throws.",
  always: "Got a partner? Rolled or hit ground balls, reaction drills off the wall.",
};

export type MindsetWeekContent = {
  theme: string;
  prompt: string;
};

export const MINDSET_WEEK_CONTENT: Record<number, MindsetWeekContent> = {
  1: {
    theme: "What do you want to be known for?",
    prompt: "Write it in one sentence. What would a coach say about you today?",
  },
  2: {
    theme: "Routines",
    prompt: "Write out your routine before every at-bat or pitch.",
  },
  3: {
    theme: "Body language",
    prompt: "What does your body do after a mistake? What should it do?",
  },
  4: {
    theme: "Effort you control",
    prompt: "Name 3 things you can do every game that take zero talent.",
  },
  5: {
    theme: "Next pitch",
    prompt: "What's your reset after a bad play? Practice it this week.",
  },
  6: {
    theme: "Confidence",
    prompt: "Write down 3 things you did well this week. Proof, not feelings.",
  },
  7: {
    theme: "Being a teammate",
    prompt: "What did you do this week that made a teammate better?",
  },
  8: {
    theme: "Pressure",
    prompt: "Try box breathing before your reps. When did it help?",
  },
  9: {
    theme: "Coachability",
    prompt: "Ask your coach one real question this week. What did you learn?",
  },
  10: {
    theme: "Competing when it's hard",
    prompt: "Think of your worst game. What would you do differently now?",
  },
  11: {
    theme: "Leadership",
    prompt: "What's one way you can lead without being the best player?",
  },
  12: {
    theme: "Who you've become",
    prompt: "Look at your week 1 answer. Are you known for it now?",
  },
};

export const PLAYBOOK_CHAPTER_WEEKS: Record<number, number> = {
  1: 1,
  4: 2,
  7: 3,
  10: 4,
};

export const SATURDAY_REFLECTION_FIELDS = [
  { key: "bestRep", label: "What was your best rep this week?" },
  { key: "stillHard", label: "What's still hard?" },
  { key: "knownForNext", label: "What do you want to be known for next week?" },
] as const;

// REVIEW: drafted by Claude
export const SPRINT_TASK_BY_AGE: Record<ProgramAgeGroup, string> = {
  AGE_8_11: "6 x 20-yard sprints, walk back rest.",
  AGE_12_15: "8 x 30-yard sprints, full rest.",
  AGE_16_18: "8 x 30-yard sprints plus 4 home-to-first runs, full rest.",
};

// REVIEW: drafted by Claude
export const CORE_TASK_8_11 =
  "3 rounds: 20-second plank, 10 dead bugs each side, 10 glute bridges.";

export const IN_SEASON_SPEED_STRENGTH_NOTE =
  "In season: 2 rounds max, stop well before tired.";

export const IN_SEASON_MOBILITY_NOTE = "In season: first half of the flow only.";

export function toContentPhase(phase: ProgramPhase): ProgramContentPhase {
  if (phase === "BUILD") {
    return "build";
  }

  if (phase === "COMPETE") {
    return "compete";
  }

  return "foundation";
}

export function getHittingIdeasForEquipment(equipment: ProgramEquipmentOption[]) {
  const ideas: string[] = [];

  if (equipment.includes("cage_field")) {
    ideas.push(HITTING_IDEAS_BY_EQUIPMENT.cage_field);
  }

  if (equipment.includes("tee_net")) {
    ideas.push(HITTING_IDEAS_BY_EQUIPMENT.tee_net);
  }

  ideas.push(HITTING_IDEAS_BY_EQUIPMENT.always);
  return ideas;
}

export function getFieldingIdeasForEquipment(equipment: ProgramEquipmentOption[]) {
  const ideas: string[] = [];

  if (equipment.includes("glove_wall")) {
    ideas.push(FIELDING_IDEAS_BY_EQUIPMENT.glove_wall);
  }

  if (equipment.includes("cage_field")) {
    ideas.push(FIELDING_IDEAS_BY_EQUIPMENT.cage_field);
  }

  ideas.push(FIELDING_IDEAS_BY_EQUIPMENT.always);
  return ideas;
}

export function getPlaybookChapterForWeek(weekNumber: number) {
  return PLAYBOOK_CHAPTER_WEEKS[weekNumber] ?? null;
}

export function roundRepsToNearestFive(value: number) {
  return Math.ceil(value / 5) * 5;
}

export function applyHalfReps(value: number) {
  return roundRepsToNearestFive(value / 2);
}

export function formatReflectionNote(fields: {
  bestRep: string;
  stillHard: string;
  knownForNext: string;
}) {
  return `Best rep: ${fields.bestRep.trim()} | Still hard: ${fields.stillHard.trim()} | Known for: ${fields.knownForNext.trim()}`;
}

export function parseReflectionNote(note: string) {
  const bestMatch = note.match(/Best rep:\s*(.*?)\s*\|\s*Still hard:/i);
  const hardMatch = note.match(/Still hard:\s*(.*?)\s*\|\s*Known for:/i);
  const knownMatch = note.match(/Known for:\s*(.*)$/i);

  return {
    bestRep: bestMatch?.[1]?.trim() ?? "",
    stillHard: hardMatch?.[1]?.trim() ?? "",
    knownForNext: knownMatch?.[1]?.trim() ?? "",
  };
}
