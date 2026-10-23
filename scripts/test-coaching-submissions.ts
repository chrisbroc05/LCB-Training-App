import assert from "node:assert/strict";
import {
  getCoachingSubmissionAvailability,
  PLAYBOOK_LIFETIME_SUBMISSION_LIMIT,
} from "../lib/coaching-submissions-shared";
import { PLAYBOOK_LIFETIME_SUBMISSION_LIMIT_LEGACY } from "../lib/playbook-entitlements-shared";
import { getReportsQueueReviewTracks } from "../lib/reports-queue-shared";

function baseFields(
  overrides: Partial<Parameters<typeof getCoachingSubmissionAvailability>[0]> = {},
) {
  return {
    membershipTier: "FREE" as const,
    playbookLegacyAccess: false,
    membershipLevel: null,
    membershipLevelExpiresAt: null,
    freeSubmissionUsed: false,
    playbookSubmissionsUsed: 0,
    coachingSubmissionsUsedThisMonth: 0,
    coachingSubmissionPeriod: "2026-10",
    eliteRolloverCredits: 0,
    ...overrides,
  };
}

function testFreeTier() {
  const available = getCoachingSubmissionAvailability(baseFields());
  assert.equal(available.remaining, 1);
  assert.equal(available.canSubmit, true);

  const used = getCoachingSubmissionAvailability(
    baseFields({ freeSubmissionUsed: true }),
  );
  assert.equal(used.remaining, 0);
  assert.equal(used.lockReason, "free-used");
}

function testPlaybookTierIgnoresFreeFlag() {
  const withFreeUsed = getCoachingSubmissionAvailability(
    baseFields({
      membershipTier: "BASIC",
      freeSubmissionUsed: true,
    }),
  );
  assert.equal(withFreeUsed.remaining, PLAYBOOK_LIFETIME_SUBMISSION_LIMIT);
  assert.equal(withFreeUsed.canSubmit, true);

  const exhaustedNew = getCoachingSubmissionAvailability(
    baseFields({
      membershipTier: "BASIC",
      playbookSubmissionsUsed: 1,
    }),
  );
  assert.equal(exhaustedNew.remaining, 0);
  assert.equal(exhaustedNew.lockReason, "playbook-used");

  const oneLeftLegacy = getCoachingSubmissionAvailability(
    baseFields({
      membershipTier: "BASIC",
      playbookLegacyAccess: true,
      playbookSubmissionsUsed: 1,
    }),
  );
  assert.equal(oneLeftLegacy.remaining, 1);
  assert.equal(oneLeftLegacy.lifetimeLimit, PLAYBOOK_LIFETIME_SUBMISSION_LIMIT_LEGACY);

  const exhaustedLegacy = getCoachingSubmissionAvailability(
    baseFields({
      membershipTier: "BASIC",
      playbookLegacyAccess: true,
      playbookSubmissionsUsed: 2,
    }),
  );
  assert.equal(exhaustedLegacy.remaining, 0);
  assert.equal(exhaustedLegacy.canSubmit, false);
}

function testPendingQuickReportLock() {
  const available = getCoachingSubmissionAvailability(
    baseFields({
      membershipTier: "FREE",
      freeSubmissionUsed: false,
    }),
    new Date(),
    { hasPendingQuickWrittenReport: true },
  );
  assert.equal(available.canSubmit, false);
  assert.equal(available.lockReason, "pending-quick-report");
}

function testReportsQueueTracksDefaultVideo() {
  const tracks = getReportsQueueReviewTracks("VIDEO");
  assert.deepEqual(tracks, ["QUICK_SIX_WEEK", "ORG_TRIAL_QUICK"]);
}

function testTwelveWeekUnlimited() {
  const availability = getCoachingSubmissionAvailability(
    baseFields({
      membershipTier: "TWELVE_WEEK",
      freeSubmissionUsed: true,
      playbookSubmissionsUsed: 99,
      coachingSubmissionsUsedThisMonth: 99,
    }),
  );
  assert.equal(availability.canSubmit, true);
  assert.equal(availability.remaining, 999);
}

function main() {
  testFreeTier();
  testPlaybookTierIgnoresFreeFlag();
  testPendingQuickReportLock();
  testReportsQueueTracksDefaultVideo();
  testTwelveWeekUnlimited();
  console.log("test-coaching-submissions: all passed");
}

main();
