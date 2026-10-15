import {
  MAX_DAY_LOG_NOTE_LENGTH,
  validateProgramNote,
} from "@/lib/program-note-shared";

export const TASK_COMPLETION_TYPE_STANDARD = "STANDARD";
export const TASK_COMPLETION_TYPE_OWN_LIFT = "OWN_LIFT";

export type TaskCompletionType =
  | typeof TASK_COMPLETION_TYPE_STANDARD
  | typeof TASK_COMPLETION_TYPE_OWN_LIFT;

export const OWN_LIFT_SHEET_TITLE = "What did you do?";

export const OWN_LIFT_NOTE_PLACEHOLDER =
  "e.g. Team lift: squats 4x5, RDLs 3x8, pull-ups 3x10";

export function validateOwnLiftNote(note: string) {
  return validateProgramNote(note, { maxLength: MAX_DAY_LOG_NOTE_LENGTH });
}

export function canSaveOwnLiftNote(note: string) {
  return validateOwnLiftNote(note).ok;
}

export function isOwnLiftCompletion(completionType: string | null | undefined) {
  return completionType === TASK_COMPLETION_TYPE_OWN_LIFT;
}

export function parseCompletionTypeFromRequest(
  value: unknown,
): TaskCompletionType | null {
  if (value === TASK_COMPLETION_TYPE_OWN_LIFT) {
    return TASK_COMPLETION_TYPE_OWN_LIFT;
  }
  if (value === TASK_COMPLETION_TYPE_STANDARD || value === undefined || value === null) {
    return TASK_COMPLETION_TYPE_STANDARD;
  }
  return null;
}
