import { getMarketingEmailAgeDays } from "@/lib/marketing-email-shared";
import { isOrgTrialWindowActive } from "@/lib/org-shared";

export const ORG_TRIAL_SUBMISSION_REMINDER_MIN_DAYS = 2;

export function isOrgTrialSubmissionReminderDue(signupDate: Date, now = new Date()): boolean {
  return getMarketingEmailAgeDays(signupDate, now) >= ORG_TRIAL_SUBMISSION_REMINDER_MIN_DAYS;
}

export function shouldOfferFreeSubmissionReminder(params: {
  organizationId: string | null;
  trialStartsAt: Date | null;
  trialEndsAt: Date | null;
  orgActive: boolean;
  now?: Date;
}): boolean {
  if (!params.organizationId || !params.orgActive) {
    return true;
  }
  if (!isOrgTrialWindowActive(params.trialStartsAt, params.trialEndsAt, params.now)) {
    return true;
  }
  return false;
}
