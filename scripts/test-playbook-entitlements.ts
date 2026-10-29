import assert from "node:assert/strict";
import {
  canAccessWorkoutResourceFile,
  PLAYBOOK_INCLUDED_GUIDE_FILENAMES,
} from "../lib/workout-resources";
import {
  canViewDrill,
  getPlaybookLifetimeSubmissionLimit,
  hasFullDrillLibraryAccess,
  hasPlaybookWorkoutProgramDownloads,
} from "../lib/playbook-entitlements-shared";
import { buildPlaybookPurchaseWelcomeSummary } from "../lib/playbook-dashboard-copy-shared";

function testNewBasicEntitlements() {
  const user = {
    membershipTier: "BASIC" as const,
    playbookLegacyAccess: false,
    membershipLevel: null,
    membershipLevelExpiresAt: null,
  };
  assert.equal(getPlaybookLifetimeSubmissionLimit(user), 1);
  assert.equal(hasFullDrillLibraryAccess(user), false);
  assert.equal(hasPlaybookWorkoutProgramDownloads(user), false);

  for (const filename of PLAYBOOK_INCLUDED_GUIDE_FILENAMES) {
    assert.equal(canAccessWorkoutResourceFile(user, filename), true);
  }
  assert.equal(canAccessWorkoutResourceFile(user, "LCB_Rotational_Sample.pdf"), false);
  assert.equal(canAccessWorkoutResourceFile(user, "LCB_Recruiting_Guide.pdf"), false);

  const starter = new Set(["drill-a"]);
  assert.equal(
    canViewDrill(
      { ...user, starterDrillIds: starter, grantedDrillIds: [] },
      "drill-a",
    ),
    true,
  );
  assert.equal(
    canViewDrill(
      { ...user, starterDrillIds: starter, grantedDrillIds: [] },
      "drill-b",
    ),
    false,
  );
}

function testLegacyBasicEntitlements() {
  const user = {
    membershipTier: "BASIC" as const,
    playbookLegacyAccess: true,
    membershipLevel: null,
    membershipLevelExpiresAt: null,
  };
  assert.equal(getPlaybookLifetimeSubmissionLimit(user), 2);
  assert.equal(hasFullDrillLibraryAccess(user), true);
  assert.equal(canAccessWorkoutResourceFile(user, "LCB_Rotational_Sample.pdf"), true);
}

function testPlaybookWelcomeCopy() {
  const newBuyer = {
    membershipTier: "BASIC" as const,
    playbookLegacyAccess: false,
    membershipLevel: null,
    membershipLevelExpiresAt: null,
  };
  const summary = buildPlaybookPurchaseWelcomeSummary(newBuyer);
  assert.match(summary, /1 lifetime coaching submission/);
  assert.match(summary, /starter drills/);
  assert.doesNotMatch(summary, /2 lifetime/);
  assert.doesNotMatch(summary, /full drill library/);

  const legacy = buildPlaybookPurchaseWelcomeSummary({
    ...newBuyer,
    playbookLegacyAccess: true,
  });
  assert.match(legacy, /2 lifetime coaching submissions/);
  assert.match(legacy, /full drill library/);
}

function main() {
  testNewBasicEntitlements();
  testLegacyBasicEntitlements();
  testPlaybookWelcomeCopy();
  console.log("test-playbook-entitlements: all passed");
}

main();
