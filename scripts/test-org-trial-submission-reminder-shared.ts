import assert from "node:assert/strict";
import { getMarketingEmailAgeDays } from "../lib/marketing-email-shared";
import {
  isOrgTrialSubmissionReminderDue,
  ORG_TRIAL_SUBMISSION_REMINDER_MIN_DAYS,
  shouldOfferFreeSubmissionReminder,
} from "../lib/org-trial-submission-reminder-shared";

const signup = new Date("2026-01-01T12:00:00.000Z");
const day2 = new Date(signup.getTime() + ORG_TRIAL_SUBMISSION_REMINDER_MIN_DAYS * 24 * 60 * 60 * 1000);
const day1 = new Date(signup.getTime() + 1 * 24 * 60 * 60 * 1000);

assert.equal(isOrgTrialSubmissionReminderDue(signup, day1), false);
assert.equal(isOrgTrialSubmissionReminderDue(signup, day2), true);
assert.equal(getMarketingEmailAgeDays(signup, day2), 2);

const day31 = new Date(signup.getTime() + 31 * 24 * 60 * 60 * 1000);
assert.equal(isOrgTrialSubmissionReminderDue(signup, day31), false);

assert.equal(
  shouldOfferFreeSubmissionReminder({
    organizationId: "org",
    orgActive: true,
    trialStartsAt: new Date("2025-12-01T06:00:00.000Z"),
    trialEndsAt: new Date("2026-12-01T06:00:00.000Z"),
    now: day2,
  }),
  false,
);

assert.equal(
  shouldOfferFreeSubmissionReminder({
    organizationId: null,
    orgActive: false,
    trialStartsAt: null,
    trialEndsAt: null,
    now: day2,
  }),
  true,
);

console.log("test-org-trial-submission-reminder-shared: all passed");
