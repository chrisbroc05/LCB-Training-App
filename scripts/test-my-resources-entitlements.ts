import assert from "node:assert/strict";
import {
  canDownloadGuideFilename,
  canDownloadWorkoutPdfs,
  type AccessUserFields,
} from "../lib/access-shared";
import { MY_RESOURCES_GUIDE_FILENAMES } from "../lib/my-resources-catalog-shared";

function baseUser(overrides: Partial<AccessUserFields> = {}): AccessUserFields {
  return {
    membershipTier: "FREE",
    membershipLevel: null,
    membershipLevelExpiresAt: null,
    playbookLegacyAccess: false,
    ...overrides,
  };
}

function testTwelveWeekFullWorkoutsAndGuides() {
  const user = baseUser({
    membershipTier: "FREE",
    membershipLevel: "ALL_ACCESS",
    membershipLevelExpiresAt: new Date(Date.now() + 86400000).toISOString(),
  });
  assert.equal(canDownloadWorkoutPdfs(user), true);
  for (const guide of MY_RESOURCES_GUIDE_FILENAMES) {
    assert.equal(canDownloadGuideFilename(user, guide), true, guide);
  }
}

function testLegacyPlaybookFullWorkouts() {
  const user = baseUser({ membershipTier: "BASIC", playbookLegacyAccess: true });
  assert.equal(canDownloadWorkoutPdfs(user), true);
  assert.equal(canDownloadGuideFilename(user, "LCB_Recruiting_Guide.pdf"), false);
}

function testCoreStartersNotFullPdfs() {
  const user = baseUser({
    membershipTier: "BASIC",
    membershipLevel: "CORE",
    membershipLevelExpiresAt: new Date(Date.now() + 86400000).toISOString(),
  });
  assert.equal(canDownloadWorkoutPdfs(user), false);
  assert.equal(canDownloadGuideFilename(user, "LCB_Arm_Care_4Week_Starter.pdf"), true);
  assert.equal(canDownloadGuideFilename(user, "LCB_Recruiting_Guide.pdf"), false);
}

function testTwelveWeekTierEnum() {
  const user = baseUser({ membershipTier: "TWELVE_WEEK" });
  assert.equal(canDownloadWorkoutPdfs(user), true);
  assert.equal(canDownloadGuideFilename(user, "LCB_Recruiting_Guide.pdf"), true);
}

testTwelveWeekFullWorkoutsAndGuides();
testLegacyPlaybookFullWorkouts();
testCoreStartersNotFullPdfs();
testTwelveWeekTierEnum();
console.log("my-resources entitlements ok");
