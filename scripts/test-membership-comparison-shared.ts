import assert from "node:assert/strict";
import {
  buildMembershipFoundingPlusHighlight,
  chooseMembershipLevelButtonLabel,
  formatMembershipComparisonCell,
  listMembershipComparisonColumns,
  listMembershipComparisonRows,
  listMembershipStepUpCards,
  MEMBERSHIP_COMPARISON_PLUS_EXTRA_REVIEW_NOTE,
  MEMBERSHIP_COMPARISON_SUBTITLE,
  resolveMembershipFoundingPlusHighlight,
} from "../lib/membership-comparison-shared";

assert.equal(MEMBERSHIP_COMPARISON_SUBTITLE, "Pick the level that fits your player.");
assert.equal(chooseMembershipLevelButtonLabel("CORE"), "Choose Core");
assert.equal(chooseMembershipLevelButtonLabel("PLUS"), "Choose Plus");
assert.equal(chooseMembershipLevelButtonLabel("ALL_ACCESS"), "Choose All-Access");

const cards = listMembershipStepUpCards();
assert.deepEqual(
  cards.map((card) => card.key),
  ["CORE", "PLUS", "ALL_ACCESS"],
);
assert.equal(cards[1]!.recommended, true);
assert.equal(cards[1]!.includesPriorLabel, "Everything in Core, plus:");
assert.equal(cards[2]!.includesPriorLabel, "Everything in Plus, plus:");
assert.ok(cards[0]!.bullets.some((bullet) => /Written swing report/.test(bullet)));
assert.ok(cards[1]!.bullets.some((bullet) => /in-depth video review/.test(bullet)));
assert.ok(cards[1]!.bullets.includes(MEMBERSHIP_COMPARISON_PLUS_EXTRA_REVIEW_NOTE));
assert.ok(cards[2]!.bullets.some((bullet) => /Recruiting Guide/.test(bullet)));

const rows = listMembershipComparisonRows();
const byId = Object.fromEntries(rows.map((row) => [row.id, row]));
assert.equal(
  formatMembershipComparisonCell(byId["swing-feedback"]!.cells.PLUS),
  "1 in-depth video review per month",
);
assert.equal(formatMembershipComparisonCell(byId.guides!.cells.CORE), "Starter guides");
assert.equal(formatMembershipComparisonCell(byId.guides!.cells.PLUS), "All guides");
assert.equal(formatMembershipComparisonCell(byId["daily-challenge"]!.cells.CORE), "Yes");
assert.equal(listMembershipComparisonColumns()[1]!.note, MEMBERSHIP_COMPARISON_PLUS_EXTRA_REVIEW_NOTE);

const founding = buildMembershipFoundingPlusHighlight({
  orgName: "Northwest Travelers",
  founding: {
    foundingOfferEnabled: true,
    foundingOfferDeadline: new Date("2026-01-15T18:00:00.000Z"),
    foundingOfferMonths: 12,
  },
  now: new Date("2026-01-01T12:00:00.000Z"),
});
assert.ok(founding);
assert.match(founding!.line, /Northwest Travelers founding price: \$15\/mo/);
assert.match(founding!.line, /January 15/);

assert.equal(
  resolveMembershipFoundingPlusHighlight({
    signedIn: false,
    organizationId: "org-1",
    orgName: "Northwest Travelers",
    founding: {
      foundingOfferEnabled: true,
      foundingOfferDeadline: new Date("2026-01-15T18:00:00.000Z"),
      foundingOfferMonths: 12,
    },
    now: new Date("2026-01-01T12:00:00.000Z"),
  }),
  null,
  "logged-out visitors never see founding",
);

assert.equal(
  resolveMembershipFoundingPlusHighlight({
    signedIn: true,
    organizationId: null,
    orgName: null,
    founding: {
      foundingOfferEnabled: true,
      foundingOfferDeadline: new Date("2026-01-15T18:00:00.000Z"),
      foundingOfferMonths: 12,
    },
    now: new Date("2026-01-01T12:00:00.000Z"),
  }),
  null,
  "non-org members never see founding",
);

const orgMemberFounding = resolveMembershipFoundingPlusHighlight({
  signedIn: true,
  organizationId: "org-1",
  orgName: "Northwest Travelers",
  founding: {
    foundingOfferEnabled: true,
    foundingOfferDeadline: new Date("2026-01-15T18:00:00.000Z"),
    foundingOfferMonths: 12,
  },
  now: new Date("2026-01-01T12:00:00.000Z"),
});
assert.ok(orgMemberFounding);
assert.match(orgMemberFounding!.line, /Northwest Travelers founding price/);

console.log("test-membership-comparison-shared: ok");
console.log("--- step-up cards ---");
for (const card of cards) {
  console.log(`${card.displayName}${card.recommended ? " [Recommended]" : ""}`);
  if (card.includesPriorLabel) {
    console.log(`  ${card.includesPriorLabel}`);
  }
  for (const bullet of card.bullets) {
    console.log(`  - ${bullet}`);
  }
}
