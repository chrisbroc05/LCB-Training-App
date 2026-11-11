import assert from "node:assert/strict";
import {
  buildMembershipFoundingPlusHighlight,
  formatMembershipComparisonCell,
  listMembershipComparisonColumns,
  listMembershipComparisonRows,
  MEMBERSHIP_COMPARISON_PLUS_EXTRA_REVIEW_NOTE,
} from "../lib/membership-comparison-shared";
import { getHomeCoachingStatus } from "../lib/home-coaching-status-shared";
import type { CoachingSubmissionUserFields } from "../lib/coaching-submissions-shared";

const columns = listMembershipComparisonColumns();
assert.deepEqual(
  columns.map((column) => column.key),
  ["CORE", "PLUS", "ALL_ACCESS"],
);
assert.equal(columns[1]!.note, MEMBERSHIP_COMPARISON_PLUS_EXTRA_REVIEW_NOTE);
assert.equal(columns[0]!.note, null);
assert.match(MEMBERSHIP_COMPARISON_PLUS_EXTRA_REVIEW_NOTE, /\$40/);

const rows = listMembershipComparisonRows();
const byId = Object.fromEntries(rows.map((row) => [row.id, row]));

assert.equal(formatMembershipComparisonCell(byId["starter-drills"]!.cells.CORE), "Yes");
assert.equal(formatMembershipComparisonCell(byId["full-drill-library"]!.cells.CORE), "-");
assert.equal(formatMembershipComparisonCell(byId["full-drill-library"]!.cells.PLUS), "Yes");
assert.equal(formatMembershipComparisonCell(byId["starter-workouts"]!.cells.CORE), "Yes");
assert.equal(formatMembershipComparisonCell(byId["full-workout-programs"]!.cells.CORE), "-");
assert.equal(formatMembershipComparisonCell(byId["full-workout-programs"]!.cells.PLUS), "Yes");

assert.equal(byId["swing-feedback"]!.label, "Swing feedback from Coach Broc");
assert.equal(
  formatMembershipComparisonCell(byId["swing-feedback"]!.cells.CORE),
  "Written report every 6 weeks",
);
assert.equal(
  formatMembershipComparisonCell(byId["swing-feedback"]!.cells.PLUS),
  "1 in-depth video review per month",
);
assert.equal(
  formatMembershipComparisonCell(byId["swing-feedback"]!.cells.ALL_ACCESS),
  "Weekly video review",
);
assert.equal(byId["swing-reports"], undefined);
assert.equal(byId["in-depth-reviews"], undefined);

assert.equal(formatMembershipComparisonCell(byId.playbook!.cells.CORE), "-");
assert.equal(formatMembershipComparisonCell(byId.playbook!.cells.PLUS), "Yes");
assert.equal(formatMembershipComparisonCell(byId.guides!.cells.CORE), "Starter guides");
assert.equal(formatMembershipComparisonCell(byId.guides!.cells.PLUS), "All guides");
assert.equal(formatMembershipComparisonCell(byId.guides!.cells.ALL_ACCESS), "All guides");
assert.equal(formatMembershipComparisonCell(byId.messaging!.cells.PLUS), "Yes");
assert.equal(formatMembershipComparisonCell(byId["recruiting-guide"]!.cells.PLUS), "-");
assert.equal(formatMembershipComparisonCell(byId["recruiting-guide"]!.cells.ALL_ACCESS), "Yes");
assert.equal(formatMembershipComparisonCell(byId["daily-challenge"]!.cells.CORE), "Yes");
assert.equal(formatMembershipComparisonCell(byId["daily-challenge"]!.cells.PLUS), "Yes");
assert.equal(formatMembershipComparisonCell(byId["daily-challenge"]!.cells.ALL_ACCESS), "Yes");
assert.equal(formatMembershipComparisonCell(byId["daily-plan"]!.cells.PLUS), "-");
assert.equal(formatMembershipComparisonCell(byId["daily-plan"]!.cells.ALL_ACCESS), "Yes");

const founding = buildMembershipFoundingPlusHighlight({
  orgName: "NWT",
  founding: {
    foundingOfferEnabled: true,
    foundingOfferDeadline: new Date("2026-01-15T18:00:00.000Z"),
    foundingOfferMonths: 12,
  },
  now: new Date("2026-01-01T12:00:00.000Z"),
});
assert.ok(founding);
assert.match(founding!.line, /NWT founding price: \$15\/mo/);

function trialUser(used: boolean): CoachingSubmissionUserFields {
  return {
    membershipTier: "FREE",
    membershipLevel: null,
    membershipLevelExpiresAt: null,
    playbookLegacyAccess: false,
    organizationId: "org-1",
    orgName: "NWT",
    orgTrialActive: true,
    orgTrialQuickReportUsed: used,
    freeSubmissionUsed: false,
    playbookSubmissionsUsed: 0,
    coachingSubmissionsUsedThisMonth: 0,
    coachingSubmissionPeriod: null,
    eliteRolloverCredits: 0,
  };
}

const unused = getHomeCoachingStatus({ user: trialUser(false) });
assert.equal(unused.primaryLabel, "Send your swing");
assert.equal(unused.showTwelveWeekPitch, false);

console.log("test-membership-comparison-shared: ok");
console.log("--- comparison rows ---");
for (const row of rows) {
  console.log(
    [
      row.label,
      formatMembershipComparisonCell(row.cells.CORE),
      formatMembershipComparisonCell(row.cells.PLUS),
      formatMembershipComparisonCell(row.cells.ALL_ACCESS),
    ].join(" | "),
  );
}
console.log(`Plus note: ${MEMBERSHIP_COMPARISON_PLUS_EXTRA_REVIEW_NOTE}`);
