import assert from "node:assert/strict";
import {
  PUBLIC_MEMBERSHIP_LEVELS_ENABLED,
  getUpgradeLabelForLevel,
} from "../lib/membership-levels-shared";
import {
  canDownloadGuideFilename,
  canMessageCoach,
  canViewDrill,
  getReviewAllowance,
  getWorkoutAccessMode,
  hasFullDrillLibraryAccess,
  resolveEffectiveLevel,
} from "../lib/access-shared";
import { getProgramDay, getCycleProgramDay, PROGRAM_DAY_COUNT } from "../lib/program-schedule";
import { parseProgramDateKey } from "../lib/program-schedule";
import { toPlaybookEntitlementFields } from "../lib/playbook-entitlements-shared";

function fields(
  tier: "FREE" | "BASIC" | "TWELVE_WEEK" | "MEMORABLE" | "ELITE",
  opts: {
    legacy?: boolean;
    level?: "CORE" | "PLUS" | "ALL_ACCESS" | null;
    expires?: string | null;
  } = {},
) {
  return toPlaybookEntitlementFields(
    tier,
    opts.legacy ?? false,
    opts.level ?? null,
    opts.expires ?? null,
  );
}

const starter = new Set(["starter-1"]);

console.log("test-access: effective levels");
assert.equal(resolveEffectiveLevel(fields("TWELVE_WEEK")), "TWELVE_WEEK");
assert.equal(resolveEffectiveLevel(fields("FREE", { level: "CORE" })), "CORE");
assert.equal(resolveEffectiveLevel(fields("FREE", { level: "PLUS" })), "PLUS");
assert.equal(resolveEffectiveLevel(fields("FREE", { level: "ALL_ACCESS" })), "ALL_ACCESS");
assert.equal(resolveEffectiveLevel(fields("BASIC")), "PLAYBOOK");
assert.equal(resolveEffectiveLevel(fields("MEMORABLE")), "LEGACY_MEMORABLE");
assert.equal(resolveEffectiveLevel(fields("ELITE")), "LEGACY_ELITE");
assert.equal(
  resolveEffectiveLevel(fields("FREE", { level: "CORE", expires: "2020-01-01T00:00:00.000Z" })),
  "FREE",
);

console.log("test-access: legacy playbook unchanged");
assert.equal(hasFullDrillLibraryAccess(fields("BASIC", { legacy: true })), true);
assert.equal(hasFullDrillLibraryAccess(fields("BASIC", { legacy: false })), false);
assert.equal(getWorkoutAccessMode(fields("BASIC", { legacy: true })), "full_programs");
assert.equal(getWorkoutAccessMode(fields("BASIC", { legacy: false })), "none");

console.log("test-access: CORE vs PLUS");
assert.equal(getWorkoutAccessMode(fields("FREE", { level: "CORE" })), "starter_in_app");
assert.equal(getWorkoutAccessMode(fields("FREE", { level: "PLUS" })), "full_programs");
assert.equal(
  canViewDrill(
    { ...fields("FREE", { level: "CORE" }), starterDrillIds: starter, grantedDrillIds: [] },
    "starter-1",
  ),
  true,
);
assert.equal(
  canViewDrill(
    { ...fields("FREE", { level: "CORE" }), starterDrillIds: starter, grantedDrillIds: [] },
    "pro-1",
  ),
  false,
);
assert.equal(hasFullDrillLibraryAccess(fields("FREE", { level: "PLUS" })), true);

console.log("test-access: messaging");
assert.equal(canMessageCoach(fields("FREE", { level: "CORE" })), false);
assert.equal(canMessageCoach(fields("FREE", { level: "PLUS" })), true);
assert.equal(canMessageCoach(fields("TWELVE_WEEK")), true);
assert.equal(canMessageCoach(fields("FREE", { level: "ALL_ACCESS" })), true);

console.log("test-access: guides");
assert.equal(canDownloadGuideFilename(fields("FREE", { level: "CORE" }), "LCB_PreGame_Warmup.pdf"), true);
assert.equal(
  canDownloadGuideFilename(fields("FREE", { level: "CORE" }), "LCB_Mental_Game_Workbook.pdf"),
  false,
);
assert.equal(
  canDownloadGuideFilename(fields("FREE", { level: "PLUS" }), "LCB_Mental_Game_Workbook.pdf"),
  true,
);
assert.equal(
  canDownloadGuideFilename(fields("TWELVE_WEEK"), "LCB_Recruiting_Guide.pdf"),
  true,
);
assert.equal(
  canDownloadGuideFilename(fields("FREE", { level: "PLUS" }), "LCB_Recruiting_Guide.pdf"),
  false,
);

console.log("test-access: review allowance");
const plusAllowance = getReviewAllowance({
  ...fields("FREE", { level: "PLUS" }),
  freeSubmissionUsed: false,
  playbookSubmissionsUsed: 0,
  coachingSubmissionsUsedThisMonth: 0,
  coachingSubmissionPeriod: "2026-10",
  eliteRolloverCredits: 0,
});
assert.equal(plusAllowance.kind, "in_depth_monthly");
assert.equal(plusAllowance.canSubmit, true);

const playbookAllowance = getReviewAllowance({
  ...fields("BASIC"),
  freeSubmissionUsed: false,
  playbookSubmissionsUsed: 0,
  coachingSubmissionsUsedThisMonth: 0,
  coachingSubmissionPeriod: "2026-10",
  eliteRolloverCredits: 0,
});
assert.equal(playbookAllowance.kind, "playbook_lifetime");

console.log("test-access: open-ended program schedule");
const start = parseProgramDateKey("2026-01-05");
const day85 = getProgramDay({ startDate: start, planMode: "OPEN_ENDED" }, parseProgramDateKey("2026-03-30"));
assert.equal(day85.isComplete, false);
assert.equal(day85.programDay, 1);
assert.equal(getCycleProgramDay(85), 1);
assert.equal(getCycleProgramDay(PROGRAM_DAY_COUNT), PROGRAM_DAY_COUNT);

const fixed85 = getProgramDay({ startDate: start, planMode: "FIXED_12_WEEK" }, parseProgramDateKey("2026-03-30"));
assert.equal(fixed85.isComplete, true);

console.log("test-access: public marketing gate");
assert.equal(PUBLIC_MEMBERSHIP_LEVELS_ENABLED, false);
assert.match(getUpgradeLabelForLevel("PLUS"), /Upgrade for more access/);

console.log("test-access: all passed");
