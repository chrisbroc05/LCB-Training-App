export const COACH_NOTE_MIN_LENGTH = 1;
export const COACH_NOTE_MAX_LENGTH = 2000;

export function validateCoachNoteBody(body: string) {
  const trimmed = body.trim();
  if (trimmed.length < COACH_NOTE_MIN_LENGTH) {
    return { ok: false as const, error: "Note cannot be empty." };
  }
  if (trimmed.length > COACH_NOTE_MAX_LENGTH) {
    return { ok: false as const, error: `Note must be ${COACH_NOTE_MAX_LENGTH} characters or less.` };
  }
  return { ok: true as const, body: trimmed };
}
