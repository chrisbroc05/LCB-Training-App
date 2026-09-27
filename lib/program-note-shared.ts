export const MIN_PROGRAM_NOTE_LENGTH = 20;
export const MAX_TASK_NOTE_LENGTH = 400;
export const MAX_DAY_LOG_NOTE_LENGTH = 500;

export const PROGRAM_NOTE_REMINDER =
  "Be specific. The more you tell me, the more I can help.";

export const LOW_EFFORT_NOTE_MESSAGE =
  "Give me a little more than that. What actually happened?";

export const GAME_PRACTICE_DIRECTION =
  "Had a game or practice today? Log it here. It counts as your hitting and fielding for the day.";

const LOW_EFFORT_NOTES = new Set([
  "good",
  "bad",
  "fine",
  "ok",
  "okay",
  "done",
  "did it",
  "great",
  "meh",
  "same",
  "nothing",
]);

export function isLowEffortNote(note: string) {
  return LOW_EFFORT_NOTES.has(note.trim().toLowerCase());
}

export function validateProgramNote(
  note: string,
  options?: { maxLength?: number },
) {
  const trimmed = note.trim();
  const maxLength = options?.maxLength ?? MAX_TASK_NOTE_LENGTH;

  if (trimmed.length < MIN_PROGRAM_NOTE_LENGTH) {
    return {
      ok: false as const,
      error: `Notes must be at least ${MIN_PROGRAM_NOTE_LENGTH} characters.`,
    };
  }

  if (trimmed.length > maxLength) {
    return {
      ok: false as const,
      error: `Notes must be ${maxLength} characters or less.`,
    };
  }

  if (isLowEffortNote(trimmed)) {
    return { ok: false as const, error: LOW_EFFORT_NOTE_MESSAGE };
  }

  return { ok: true as const, note: trimmed };
}

export function canSaveProgramNote(
  note: string,
  maxLength = MAX_TASK_NOTE_LENGTH,
) {
  return validateProgramNote(note, { maxLength }).ok;
}

export function canSaveReflectionFields(fields: {
  bestRep: string;
  stillHard: string;
  knownForNext: string;
}) {
  return (
    canSaveProgramNote(fields.bestRep) &&
    canSaveProgramNote(fields.stillHard) &&
    canSaveProgramNote(fields.knownForNext)
  );
}

export function getTaskNotePlaceholder(task: {
  type: string;
  playbookIsRead?: boolean;
}) {
  switch (task.type) {
    case "hitting":
      return "How did you get your swings in? How did the focus feel? What clicked and what didn't?";
    case "fielding":
      return "How did you get your reps in? What felt smooth, and what was still hard?";
    case "speed":
    case "strength":
    case "mobility":
    case "sprint":
    case "core":
      return "How did it feel? What was hard? Anything you had to change or skip?";
    case "custom":
      return "How did it go? What did you notice?";
    case "playbook":
      return task.playbookIsRead
        ? "What stood out to you, and why?"
        : "Your answer";
    case "mindset":
      return "Your answer";
    default:
      return "How did it go? What did you notice?";
  }
}

export function getWorkoutNotePlaceholder() {
  return "How did it feel? What was hard? Anything you had to change or skip?";
}

export function getPracticeNotePlaceholder() {
  return "What did you work on? What went well, and what do you want to get better at?";
}

export function getGameNotePlaceholder() {
  return "Walk me through your at-bats and plays in the field. What went well, and what would you do differently?";
}

export function validateDayLogNote(note: string) {
  return validateProgramNote(note, { maxLength: MAX_DAY_LOG_NOTE_LENGTH });
}
