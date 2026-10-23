import { getReviewAllowance, type AccessUserFields } from "@/lib/access-shared";
import { formatReviewAllowanceDisplay } from "@/lib/coaching-submission-display-shared";
import type { CoachingSubmissionUserFields } from "@/lib/coaching-submissions-shared";

export function getCoachingQuotaDisplayCopy(
  user: AccessUserFields & CoachingSubmissionUserFields,
  now = new Date(),
) {
  const allowance = getReviewAllowance(user, now);
  return formatReviewAllowanceDisplay(allowance, {
    coreQuickReportNextEligibleAt: user.coreQuickReportNextEligibleAt,
    now,
  });
}
