/**
 * All-Access program cap: active All-Access subs + active fixed 12-Week enrollments only.
 */

export function countsTowardAllAccessProgramCap(params: {
  membershipTier: string;
  programEnrollmentStatus: string | null | undefined;
  programPlanMode: string | null | undefined;
  twelveWeekProgramEndsAt: Date | string | null | undefined;
  now?: Date;
}): boolean {
  if (params.membershipTier !== "TWELVE_WEEK") {
    return false;
  }
  if (params.programEnrollmentStatus !== "ACTIVE") {
    return false;
  }
  if (params.programPlanMode !== "FIXED_12_WEEK") {
    return false;
  }
  const ends = params.twelveWeekProgramEndsAt;
  if (!ends) {
    return true;
  }
  const endDate = ends instanceof Date ? ends : new Date(ends);
  if (Number.isNaN(endDate.getTime())) {
    return false;
  }
  const now = params.now ?? new Date();
  return endDate.getTime() >= now.getTime();
}
