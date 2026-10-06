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

export const PROGRAM_DRILL_VIMEO_IDS_BY_TITLE: Record<string, string> = {
  "Pre pitch hop": "1233142855",
  "Solo infield drills for quick hands": "1233143850",
  "YES YES NO": "1233142709",
  "Where our hands should be at launch": "1233142509",
  "Staying connected": "1233143083",
  "Give yourself space in your setup": "1233143528",
  "The mental side to hitting with two strikes": "1233463927",
  "Two Strike Approach": "1233464583",
  "Situational Hitting": "1233464969",
  "Approach by count": "1233465905",
  "It starts at practice": "1233148098",
  "Body Language and Control your emotions": "1233466376",
};

export const HITTING_FOCUS_CUE_DRILL_TITLES: Partial<Record<number, string[]>> = {
  1: ["Give yourself space in your setup", "Posture work", "Staying Stacked in Our Back Leg"],
  2: ["Where our hands should be at launch", "Coil into your load", "Don't drift in your load"],
  4: ["Staying connected", "Stop casting your hands", "Slot position"],
  8: ["Two Strike Approach", "The mental side to hitting with two strikes"],
  10: ["Situational Hitting"],
  11: ["Approach by count", "YES YES NO"],
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

export const HITTING_WAYS_OPTIONS = [
  {
    key: "cage_field" as const,
    label: "Cage or field:",
    text: "mix tee, flips, machine or live arm.",
  },
  {
    key: "tee_net" as const,
    label: "Tee and net:",
    text: "tee work, or flips into the net.",
  },
  {
    key: "always" as const,
    label: "No setup:",
    text: "dry swings, mirror work or PVC pipe swings.",
  },
];

export const FIELDING_WAYS_OPTIONS = [
  {
    key: "glove_wall" as const,
    label: "Glove and a wall:",
    text: "tennis ball wall work.",
  },
  {
    key: "always" as const,
    label: "Partner:",
    text: "rolled or hit ground balls.",
  },
  {
    key: "cage_field" as const,
    label: "Field:",
    text: "live ground balls or fly balls with throws.",
  },
];

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
  extraPrompts: [string, string, string];
};

// REVIEW: drafted by Claude
export const FRIDAY_MINDSET_PROMPT =
  "Look back at your answer from Monday. Did you live it this week? What will you do differently next week?";

// REVIEW: drafted by Claude
export const MINDSET_WEEK_CONTENT: Record<number, MindsetWeekContent> = {
  1: {
    theme: "What do you want to be known for?",
    prompt: "Write it in one sentence. What would a coach say about you today?",
    extraPrompts: [
      "Who's a player you respect? What are they known for?",
      "What's one thing you did today that matches who you want to be?",
      "If your teammates described you in three words, what would they say? What do you want them to say?",
    ],
  },
  2: {
    theme: "Routines",
    prompt: "Write out your routine before every at-bat or pitch.",
    extraPrompts: [
      "What do you do the night before a game? Write your ideal version.",
      "What's your routine between pitches when you're in the field?",
      "Pick one part of your routine to lock in this week. What is it?",
    ],
  },
  3: {
    theme: "Body language",
    prompt: "What does your body do after a mistake? What should it do?",
    extraPrompts: [
      "Think of a player who never shows frustration. What do they do instead?",
      "After a strikeout, where do your eyes go? Where should they go?",
      "Did your body language help or hurt your team today? How?",
    ],
  },
  4: {
    theme: "Effort you control",
    prompt: "Name 3 things you can do every game that take zero talent.",
    extraPrompts: [
      "Did you run hard on every ball today? Where could you have given more?",
      "What does full effort look like at practice when nobody's watching?",
      "Name one effort play you made this week that nobody noticed.",
    ],
  },
  5: {
    theme: "Next pitch",
    prompt: "What's your reset after a bad play? Practice it this week.",
    extraPrompts: [
      "What's one play you're still thinking about? Write it down, then let it go.",
      "What's your one word or action to reset after a mistake?",
      "When did you move on fast this week? What helped?",
    ],
  },
  6: {
    theme: "Confidence",
    prompt: "Write down 3 things you did well this week. Proof, not feelings.",
    extraPrompts: [
      "What's one rep from today you're proud of?",
      "What's something that used to be hard for you and isn't anymore?",
      "Write what you'd tell a teammate who's struggling. Now read it to yourself.",
    ],
  },
  7: {
    theme: "Being a teammate",
    prompt: "What did you do this week that made a teammate better?",
    extraPrompts: [
      "Who on your team could use a boost right now? What will you do about it?",
      "What's the best thing a teammate ever did for you?",
      "How do you act when a teammate makes an error?",
    ],
  },
  8: {
    theme: "Pressure",
    prompt: "Try box breathing before your reps. When did it help?",
    extraPrompts: [
      "When do you feel pressure most in a game? What happens in your body?",
      "What's one thing you can control in a big moment?",
      "Think of a time you came through under pressure. What were you focused on?",
    ],
  },
  9: {
    theme: "Coachability",
    prompt: "Ask your coach one real question this week. What did you learn?",
    extraPrompts: [
      "What's one piece of feedback you got recently? What did you do with it?",
      "How do you react when a coach corrects you in front of the team?",
      "What's one thing you want to get better at? Who could help you with it?",
    ],
  },
  10: {
    theme: "Competing when it's hard",
    prompt: "Think of your worst game. What would you do differently now?",
    extraPrompts: [
      "What's the hardest part of your training right now? Why keep going?",
      "When you're down late in a game, what's your mindset?",
      "Write about a time you wanted to quit something and didn't.",
    ],
  },
  11: {
    theme: "Leadership",
    prompt: "What's one way you can lead without being the best player?",
    extraPrompts: [
      "Who's a leader you look up to? What do they do that you could copy?",
      "What's one small way you can lead at your next practice?",
      "How can you make the newest or youngest player on your team feel welcome?",
    ],
  },
  12: {
    theme: "Who you've become",
    prompt: "Look at your week 1 answer. Are you known for it now?",
    extraPrompts: [
      "What's the biggest change in your game since week 1?",
      "What habit from this program are you keeping?",
      "What do you want to be known for next season?",
    ],
  },
};

export function getMindsetPromptForDay(weekNumber: number, dayOfWeek: number) {
  if (dayOfWeek === 5) {
    return FRIDAY_MINDSET_PROMPT;
  }

  const content = MINDSET_WEEK_CONTENT[weekNumber] ?? MINDSET_WEEK_CONTENT[1];

  if (dayOfWeek === 1) {
    return content.prompt;
  }

  if (dayOfWeek === 2) {
    return content.extraPrompts[0];
  }

  if (dayOfWeek === 3) {
    return content.extraPrompts[1];
  }

  if (dayOfWeek === 4) {
    return content.extraPrompts[2];
  }

  return content.prompt;
}

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
export const SPRINT_TASK_IN_SEASON_BY_AGE: Record<ProgramAgeGroup, string> = {
  AGE_8_11: "4 x 20-yard sprints, walk back rest.",
  AGE_12_15: "4 x 30-yard sprints, full rest.",
  AGE_16_18: "4 x 30-yard sprints plus 2 home-to-first runs, full rest.",
};

export const IN_SEASON_SPRINT_NOTE = "In season: quality over quantity, full rest.";

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

function orderWaysByEquipment<T extends { key: string }>(
  options: T[],
  equipment: ProgramEquipmentOption[],
) {
  const matched = options.filter((option) => equipment.includes(option.key as ProgramEquipmentOption));
  const rest = options.filter((option) => !equipment.includes(option.key as ProgramEquipmentOption));
  return [...matched, ...rest];
}

export function getHittingIdeasForEquipment(equipment: ProgramEquipmentOption[]) {
  return orderWaysByEquipment(HITTING_WAYS_OPTIONS, equipment).map(
    (option) => `${option.label} ${option.text}`,
  );
}

export function getFieldingIdeasForEquipment(equipment: ProgramEquipmentOption[]) {
  return orderWaysByEquipment(FIELDING_WAYS_OPTIONS, equipment).map(
    (option) => `${option.label} ${option.text}`,
  );
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
