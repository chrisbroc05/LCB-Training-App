import assert from "node:assert/strict";
import {
  getCoachingSubmissionAvailability,
  PLAYBOOK_LIFETIME_SUBMISSION_LIMIT,
} from "../lib/coaching-submissions-shared";

function testFreeTier() {
  const available = getCoachingSubmissionAvailability({
    membershipTier: "FREE",
    freeSubmissionUsed: false,
    playbookSubmissionsUsed: 0,
    coachingSubmissionsUsedThisMonth: 0,
    coachingSubmissionPeriod: "2026-10",
    eliteRolloverCredits: 0,
  });
  assert.equal(available.remaining, 1);
  assert.equal(available.canSubmit, true);

  const used = getCoachingSubmissionAvailability({
    membershipTier: "FREE",
    freeSubmissionUsed: true,
    playbookSubmissionsUsed: 0,
    coachingSubmissionsUsedThisMonth: 0,
    coachingSubmissionPeriod: "2026-10",
    eliteRolloverCredits: 0,
  });
  assert.equal(used.remaining, 0);
  assert.equal(used.lockReason, "free-used");
}

function testPlaybookTierIgnoresFreeFlag() {
  const withFreeUsed = getCoachingSubmissionAvailability({
    membershipTier: "BASIC",
    freeSubmissionUsed: true,
    playbookSubmissionsUsed: 0,
    coachingSubmissionsUsedThisMonth: 0,
    coachingSubmissionPeriod: "2026-10",
    eliteRolloverCredits: 0,
  });
  assert.equal(withFreeUsed.remaining, PLAYBOOK_LIFETIME_SUBMISSION_LIMIT);
  assert.equal(withFreeUsed.canSubmit, true);

  const oneLeft = getCoachingSubmissionAvailability({
    membershipTier: "BASIC",
    freeSubmissionUsed: true,
    playbookSubmissionsUsed: 1,
    coachingSubmissionsUsedThisMonth: 0,
    coachingSubmissionPeriod: "2026-10",
    eliteRolloverCredits: 0,
  });
  assert.equal(oneLeft.remaining, 1);
  assert.equal(oneLeft.canSubmit, true);

  const exhausted = getCoachingSubmissionAvailability({
    membershipTier: "BASIC",
    freeSubmissionUsed: false,
    playbookSubmissionsUsed: 2,
    coachingSubmissionsUsedThisMonth: 0,
    coachingSubmissionPeriod: "2026-10",
    eliteRolloverCredits: 0,
  });
  assert.equal(exhausted.remaining, 0);
  assert.equal(exhausted.lockReason, "playbook-used");
  assert.equal(exhausted.canSubmit, false);
}

function testTwelveWeekUnlimited() {
  const availability = getCoachingSubmissionAvailability({
    membershipTier: "TWELVE_WEEK",
    freeSubmissionUsed: true,
    playbookSubmissionsUsed: 99,
    coachingSubmissionsUsedThisMonth: 99,
    coachingSubmissionPeriod: "2026-10",
    eliteRolloverCredits: 0,
  });
  assert.equal(availability.canSubmit, true);
  assert.equal(availability.remaining, 999);
}

function main() {
  testFreeTier();
  testPlaybookTierIgnoresFreeFlag();
  testTwelveWeekUnlimited();
  console.log("test-coaching-submissions: all passed");
}

main();
