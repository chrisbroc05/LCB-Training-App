export function hasProgramEnrollmentRecord(
  enrollment: { onboardingCompletedAt: string | Date | null } | null | undefined,
) {
  return Boolean(enrollment);
}

export function hasCompletedProgramSetup(
  enrollment: { onboardingCompletedAt: string | Date | null } | null | undefined,
) {
  return Boolean(enrollment?.onboardingCompletedAt);
}

export function shouldShowProgramSetupBanner(
  enrollment: { onboardingCompletedAt: string | Date | null } | null | undefined,
) {
  return Boolean(enrollment && !enrollment.onboardingCompletedAt);
}
