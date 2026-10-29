import "server-only";

import type { CoachingSubmissionUserFields } from "@/lib/coaching-submissions-shared";
import {
  listSwingCoachingAllowanceFormOptions,
  resolveSubmittedCoachingPoolId,
  validateCoachingSubmissionPool,
  type CoachingAllowancePickerOption,
  type CoachingAllowancePoolId,
  type CoachingSubmissionKind,
} from "@/lib/coaching-submission-pool-shared";

export function resolveCoachingSubmissionPoolContext(
  user: CoachingSubmissionUserFields,
  poolParam: string | null | undefined,
  kind: CoachingSubmissionKind,
) {
  const swingOptions =
    kind === "swing" ? listSwingCoachingAllowanceFormOptions(user) : [];
  const validation = validateCoachingSubmissionPool(user, poolParam, kind);
  const resolvedPool = validation.ok
    ? resolveSubmittedCoachingPoolId(validation, user, kind)
    : undefined;

  const selectedOption: CoachingAllowancePickerOption | null =
    resolvedPool != null
      ? (listSwingCoachingAllowanceFormOptions(user).find((option) => option.poolId === resolvedPool) ??
        null)
      : null;

  return {
    swingOptions,
    validation,
    selectedOption,
    requestedPool: resolvedPool ?? null,
  };
}

export type CoachingPoolSubmitParams = {
  requestedPool: CoachingAllowancePoolId | undefined;
};

export function coachingPoolParamsFromValidation(
  user: CoachingSubmissionUserFields,
  kind: CoachingSubmissionKind,
  validation: ReturnType<typeof validateCoachingSubmissionPool>,
): CoachingPoolSubmitParams {
  if (!validation.ok) {
    return { requestedPool: undefined };
  }
  return {
    requestedPool: resolveSubmittedCoachingPoolId(validation, user, kind),
  };
}
