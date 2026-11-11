import assert from "node:assert/strict";
import {
  canDownloadGuideFilename,
  canViewStarterWorkoutsInApp,
  type AccessUserFields,
} from "../lib/access-shared";
import {
  hubIncludedHrefIsAllowed,
  listIncludedHubResourceOverrides,
  listIncludedMyResourceGuideFilenames,
  memberPdfViewerIsAllowed,
} from "../lib/member-resource-access-shared";
import { buildMemberPdfViewerHref } from "../lib/my-resources-shared";
import { STARTER_WORKOUT_PROGRAMS } from "../lib/starter-workouts-in-app-shared";

function orgTrialUser(overrides: Partial<AccessUserFields> = {}): AccessUserFields {
  return {
    membershipTier: "FREE",
    membershipLevel: null,
    membershipLevelExpiresAt: null,
    playbookLegacyAccess: false,
    organizationId: "org-nwt",
    orgName: "NWT",
    orgTrialActive: true,
    orgTrialEndsAt: new Date("2026-12-31T23:59:59.000Z"),
    ...overrides,
  };
}

function coreUser(): AccessUserFields {
  return {
    membershipTier: "BASIC",
    membershipLevel: "CORE",
    membershipLevelExpiresAt: new Date(Date.now() + 86400000).toISOString(),
    playbookLegacyAccess: false,
  };
}

function assertIncludedAccessForUser(label: string, access: AccessUserFields) {
  assert.equal(canViewStarterWorkoutsInApp(access), true, `${label}: starter workouts in app`);

  for (const { slug, href } of listIncludedHubResourceOverrides(access)) {
    assert.equal(
      hubIncludedHrefIsAllowed(access, href),
      true,
      `${label}: hub ${slug} href ${href}`,
    );
    assert.ok(!href.includes("kind=workout"), `${label}: hub ${slug} must not use workout PDF viewer`);
  }

  for (const filename of listIncludedMyResourceGuideFilenames(access)) {
    const viewerHref = buildMemberPdfViewerHref({ kind: "guide", file: filename });
    assert.equal(
      memberPdfViewerIsAllowed(access, "guide", filename),
      true,
      `${label}: guide ${filename}`,
    );
    assert.equal(
      hubIncludedHrefIsAllowed(access, viewerHref),
      true,
      `${label}: my resources guide ${filename}`,
    );
  }

  for (const program of STARTER_WORKOUT_PROGRAMS) {
    const href = `/workouts/starters/${program.key}`;
    assert.equal(
      hubIncludedHrefIsAllowed(access, href),
      true,
      `${label}: starter program ${program.key}`,
    );
  }
}

function testCoreGuidesExcludeMentalAndRecruiting() {
  const access = coreUser();
  assert.equal(canDownloadGuideFilename(access, "LCB_PreGame_Warmup.pdf"), true);
  assert.equal(canDownloadGuideFilename(access, "LCB_Arm_Care_4Week_Starter.pdf"), true);
  assert.equal(canDownloadGuideFilename(access, "LCB_Back_and_Arm_4Week_Starter.pdf"), true);
  assert.equal(canDownloadGuideFilename(access, "LCB_Mental_Game_Workbook.pdf"), false);
  assert.equal(canDownloadGuideFilename(access, "LCB_Recruiting_Guide.pdf"), false);
}

function testFreeSamplesAvailableToOrgTrial() {
  const access = orgTrialUser();
  assert.equal(canDownloadGuideFilename(access, "LCB_Rotational_Sample.pdf"), true);
  assert.equal(canDownloadGuideFilename(access, "LCB_Mobility_Sample.pdf"), true);
}

assertIncludedAccessForUser("ORG_TRIAL", orgTrialUser());
assertIncludedAccessForUser("CORE", coreUser());
testCoreGuidesExcludeMentalAndRecruiting();
testFreeSamplesAvailableToOrgTrial();

console.log("test-resources-included-access: ok");
