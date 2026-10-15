import {
  TASK_COMPLETION_TYPE_OWN_LIFT,
  canSaveOwnLiftNote,
  parseCompletionTypeFromRequest,
  validateOwnLiftNote,
} from "../lib/program-task-completion-shared";

function assertOwnLiftValidation() {
  const short = validateOwnLiftNote("too short");
  if (short.ok) {
    throw new Error("Expected short own lift note to fail.");
  }

  const good = validateOwnLiftNote(
    "Team lift: squats 4x5, RDLs 3x8, pull-ups 3x10 with the varsity group.",
  );
  if (!good.ok) {
    throw new Error("Expected valid own lift note to pass.");
  }

  if (!canSaveOwnLiftNote(good.note)) {
    throw new Error("canSaveOwnLiftNote should accept valid note.");
  }

  if (parseCompletionTypeFromRequest(TASK_COMPLETION_TYPE_OWN_LIFT) !== TASK_COMPLETION_TYPE_OWN_LIFT) {
    throw new Error("parseCompletionTypeFromRequest failed for OWN_LIFT.");
  }

  if (parseCompletionTypeFromRequest("invalid") !== null) {
    throw new Error("parseCompletionTypeFromRequest should reject invalid values.");
  }

  console.log("Program task completion shared tests passed.");
}

assertOwnLiftValidation();
