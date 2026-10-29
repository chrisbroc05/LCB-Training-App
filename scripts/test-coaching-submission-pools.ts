import assert from "node:assert/strict";
import {
  canSubmitMindsetCoachingRequest,
  listCoachingAllowanceSummaryOptions,
  listSwingCoachingAllowanceFormOptions,
  requiresSwingAllowanceFormChoice,
  resolveAutoMindsetPoolId,
  validateCoachingSubmissionPool,
} from "../lib/coaching-submission-pool-shared";

function corePlusPlaybookUser(overrides: Record<string, unknown> = {}) {
  return {
    membershipTier: "BASIC" as const,
    playbookLegacyAccess: false,
    membershipLevel: "CORE" as const,
    membershipLevelExpiresAt: new Date("2099-01-01"),
    freeSubmissionUsed: false,
    playbookSubmissionsUsed: 0,
    coachingSubmissionsUsedThisMonth: 0,
    coachingSubmissionPeriod: "2026-10",
    eliteRolloverCredits: 0,
    coreQuickReportNextEligibleAt: null,
    orgTrialQuickReportUsed: false,
    organizationId: null,
    organization: null,
    ...overrides,
  };
}

function testSwingFormOptionsCorePlusPlaybook() {
  const options = listSwingCoachingAllowanceFormOptions(corePlusPlaybookUser());
  assert.equal(options.length, 2);
  assert.equal(options[0]?.poolId, "core-six-week");
  assert.equal(options[1]?.poolId, "playbook-lifetime");
  assert.equal(requiresSwingAllowanceFormChoice(corePlusPlaybookUser()), true);
}

function testSummaryIncludesUnavailableCore() {
  const user = corePlusPlaybookUser({
    coreQuickReportNextEligibleAt: new Date("2099-06-01"),
  });
  const summary = listCoachingAllowanceSummaryOptions(user);
  assert.equal(summary.length, 2);
  const core = summary.find((option) => option.poolId === "core-six-week");
  assert.equal(core?.canSubmit, false);
  assert.match(core?.availabilityLine ?? "", /Next one available/);
}

function testValidateRequiresPoolWhenTwoSwingOptions() {
  const user = corePlusPlaybookUser();
  const missing = validateCoachingSubmissionPool(user, undefined, "swing");
  assert.equal(missing.ok, false);
  if (!missing.ok) {
    assert.match(missing.error, /Choose what you want from Coach Broc/i);
  }

  const playbook = validateCoachingSubmissionPool(user, "playbook-lifetime", "swing");
  assert.equal(playbook.ok, true);
  if (playbook.ok) {
    assert.equal(playbook.poolId, "playbook-lifetime");
    assert.equal(playbook.reviewTrack, "PLAYBOOK");
  }

  const core = validateCoachingSubmissionPool(user, "core-six-week", "swing");
  assert.equal(core.ok, true);
  if (core.ok) {
    assert.equal(core.poolId, "core-six-week");
    assert.equal(core.reviewTrack, "QUICK_SIX_WEEK");
  }
}

function testAutoPoolWhenOneSwingOption() {
  const user = {
    membershipTier: "BASIC" as const,
    playbookLegacyAccess: false,
    membershipLevel: null,
    membershipLevelExpiresAt: null,
    freeSubmissionUsed: false,
    playbookSubmissionsUsed: 0,
    coachingSubmissionsUsedThisMonth: 0,
    coachingSubmissionPeriod: "2026-10",
    eliteRolloverCredits: 0,
    coreQuickReportNextEligibleAt: null,
    orgTrialQuickReportUsed: false,
    organizationId: null,
    organization: null,
  };
  assert.equal(requiresSwingAllowanceFormChoice(user), false);
  const validation = validateCoachingSubmissionPool(user, undefined, "swing");
  assert.equal(validation.ok, true);
}

function testRejectIneligiblePool() {
  const user = corePlusPlaybookUser({
    coreQuickReportNextEligibleAt: new Date("2099-06-01"),
  });
  const bad = validateCoachingSubmissionPool(user, "core-six-week", "swing");
  assert.equal(bad.ok, false);
}

function testMindsetAutoPlaybookPool() {
  const user = corePlusPlaybookUser();
  assert.equal(resolveAutoMindsetPoolId(user), "playbook-lifetime");
  assert.equal(canSubmitMindsetCoachingRequest(user), true);
  const validation = validateCoachingSubmissionPool(user, undefined, "mental");
  assert.equal(validation.ok, true);
  if (validation.ok) {
    assert.equal(validation.poolId, "playbook-lifetime");
  }
}

function testMindsetBlockedWhenPlaybookUsed() {
  const user = corePlusPlaybookUser({
    playbookSubmissionsUsed: 1,
    coreQuickReportNextEligibleAt: new Date("2099-06-01"),
  });
  assert.equal(canSubmitMindsetCoachingRequest(user), false);
}

function main() {
  testSwingFormOptionsCorePlusPlaybook();
  testSummaryIncludesUnavailableCore();
  testValidateRequiresPoolWhenTwoSwingOptions();
  testAutoPoolWhenOneSwingOption();
  testRejectIneligiblePool();
  testMindsetAutoPlaybookPool();
  testMindsetBlockedWhenPlaybookUsed();
  console.log("test-coaching-submission-pools: all passed");
}

main();
