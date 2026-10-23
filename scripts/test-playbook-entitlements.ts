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

function main() {
  testNewBasicEntitlements();
  testLegacyBasicEntitlements();
  console.log("test-playbook-entitlements: all passed");
}

main();
