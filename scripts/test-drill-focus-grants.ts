import { chicagoStartOfCalendarDay } from "../lib/org-trial-dates-shared";
import { canViewDrill } from "../lib/access-shared";
import {
  collectCoachFocusTemporaryDrillIds,
  collectPermanentRecommendedDrillIds,
  isOrgWeeklyFocusDrillActiveForWeek,
  mergeUniqueDrillIds,
} from "../lib/drill-focus-grants-shared";
import { getWeekStartMondayChicago } from "../lib/org-weekly-focus-shared";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const NON_STARTER_DRILL = "1200422514";
const STARTER = new Set(["1200422510"]);

const orgTrialUser = {
  membershipTier: "FREE" as const,
  membershipLevel: "CORE" as const,
  membershipLevelExpiresAt: null,
  playbookLegacyAccess: false,
  organizationId: "org-1",
  orgTeamId: "team-1",
  orgTrialActive: true,
};

function testOrgWeeklyFocusTemporaryGrant() {
  const friday = chicagoStartOfCalendarDay(2026, 10, 23);
  const currentWeekStart = getWeekStartMondayChicago(friday);
  assert(
    isOrgWeeklyFocusDrillActiveForWeek(currentWeekStart, friday),
    "focus week should be active on Friday of that week",
  );

  const nextWeek = chicagoStartOfCalendarDay(2026, 10, 26);
  assert(
    !isOrgWeeklyFocusDrillActiveForWeek(currentWeekStart, nextWeek),
    "focus week should end after the Chicago week boundary",
  );

  const focusGrantsDuringWeek = isOrgWeeklyFocusDrillActiveForWeek(currentWeekStart, friday)
    ? [NON_STARTER_DRILL]
    : [];

  assert(
    canViewDrill(
      {
        ...orgTrialUser,
        starterDrillIds: STARTER,
        grantedDrillIds: focusGrantsDuringWeek,
      },
      NON_STARTER_DRILL,
      friday,
    ),
    "trial member should play non-starter drill on active weekly focus",
  );

  const focusGrantsAfterWeek = isOrgWeeklyFocusDrillActiveForWeek(currentWeekStart, nextWeek)
    ? [NON_STARTER_DRILL]
    : [];

  assert(
    !canViewDrill(
      {
        ...orgTrialUser,
        starterDrillIds: STARTER,
        grantedDrillIds: focusGrantsAfterWeek,
      },
      NON_STARTER_DRILL,
      nextWeek,
    ),
    "trial member should not play focus drill after the week ends",
  );
}

function testCoachTwoWeekFocus() {
  const now = new Date("2026-10-23T18:00:00.000Z");
  const active = collectCoachFocusTemporaryDrillIds(
    [
      {
        recommendedDrills: [NON_STARTER_DRILL],
        coachFocusPreset: "Stay back",
        coachFocusEndsAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      },
    ],
    now,
  );
  assert(active.includes(NON_STARTER_DRILL), "coach focus should grant drills before end date");

  const expired = collectCoachFocusTemporaryDrillIds(
    [
      {
        recommendedDrills: [NON_STARTER_DRILL],
        coachFocusPreset: "Stay back",
        coachFocusEndsAt: new Date(now.getTime() - 1000),
      },
    ],
    now,
  );
  assert(!expired.includes(NON_STARTER_DRILL), "coach focus grants expire after 14-day window");
}

function testPermanentRecommendedExcludesCoachFocusRow() {
  const permanent = collectPermanentRecommendedDrillIds(
    [
      {
        recommendedDrills: ["111"],
        coachFocusPreset: "Cue",
      },
      {
        recommendedDrills: ["222"],
        coachFocusPreset: null,
      },
    ],
    [{ recommendedDrills: ["333"] }],
  );
  assert(!permanent.includes("111"), "2-week coach focus drills should not be permanently granted");
  assert(permanent.includes("222") && permanent.includes("333"), "other recommended drills stay granted");
}

function testMergeUnique() {
  const merged = mergeUniqueDrillIds(["a", "b"], ["b", "c"]);
  assert(merged.length === 3 && merged.includes("a") && merged.includes("c"), "merge unique drill ids");
}

function main() {
  testOrgWeeklyFocusTemporaryGrant();
  testCoachTwoWeekFocus();
  testPermanentRecommendedExcludesCoachFocusRow();
  testMergeUnique();
  console.log("test-drill-focus-grants: ok");
}

main();
