import assert from "node:assert/strict";
import {
  buildOrgTrialPlaybookFoundingLine,
  buildOrgTrialPlaybookLockedCopy,
  ORG_TRIAL_PLAYBOOK_UNLOCK_WITH_PLUS_LINE,
} from "../lib/org-trial-playbook-locked-shared";

const now = new Date("2026-01-01T12:00:00.000Z");

assert.equal(
  buildOrgTrialPlaybookFoundingLine({
    orgName: "NWT",
    founding: {
      foundingOfferEnabled: false,
      foundingOfferDeadline: new Date("2026-01-15T23:59:59.000Z"),
      foundingOfferMonths: 12,
    },
    now,
  }),
  null,
);

const foundingLine = buildOrgTrialPlaybookFoundingLine({
  orgName: "NWT",
  founding: {
    foundingOfferEnabled: true,
    foundingOfferDeadline: new Date("2026-01-15T23:59:59.000Z"),
    foundingOfferMonths: 12,
  },
  now,
});
assert.ok(foundingLine?.includes("NWT families"));
assert.ok(foundingLine?.includes("January 15"));
assert.ok(foundingLine?.includes("$15 a month"));

const copy = buildOrgTrialPlaybookLockedCopy({
  orgName: "NWT",
  founding: {
    foundingOfferEnabled: true,
    foundingOfferDeadline: new Date("2026-01-15T23:59:59.000Z"),
    foundingOfferMonths: 12,
  },
  now,
});
assert.equal(copy.unlockLine, ORG_TRIAL_PLAYBOOK_UNLOCK_WITH_PLUS_LINE);
assert.ok(copy.foundingLine);

console.log("test-org-trial-playbook-locked-shared: ok");
