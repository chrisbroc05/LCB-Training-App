import assert from "node:assert/strict";
import {
  getOrgTrialJanuaryMembershipHref,
  getOrgTrialJanuaryUnlockLabel,
  getOrgTrialJanuaryUnlockMembershipForSurface,
  getOrgTrialLockedContentHref,
  getOrgTrialLockedContentMessage,
  ORG_TRIAL_JANUARY_UNLOCK_CORE_LABEL,
  ORG_TRIAL_JANUARY_UNLOCK_MEMBERSHIP_LABEL,
  ORG_TRIAL_JANUARY_UNLOCK_PLUS_LABEL,
  ORG_TRIAL_RECRUITING_LOCK_HREF,
  ORG_TRIAL_RECRUITING_LOCK_LABEL,
} from "../lib/org-trial-unlock-copy-shared";
import { isPublicMembershipLevelsEnabled } from "../lib/membership-levels-shared";

assert.equal(getOrgTrialJanuaryUnlockLabel("CORE"), ORG_TRIAL_JANUARY_UNLOCK_CORE_LABEL);
assert.equal(getOrgTrialJanuaryUnlockLabel("PLUS"), ORG_TRIAL_JANUARY_UNLOCK_PLUS_LABEL);
assert.equal(
  getOrgTrialJanuaryUnlockLabel("MEMBERSHIP"),
  ORG_TRIAL_JANUARY_UNLOCK_MEMBERSHIP_LABEL,
);

assert.equal(getOrgTrialJanuaryUnlockMembershipForSurface("drill"), "PLUS");
assert.equal(getOrgTrialJanuaryUnlockMembershipForSurface("workout"), "PLUS");
assert.equal(getOrgTrialJanuaryUnlockMembershipForSurface("playbook"), "PLUS");
assert.equal(getOrgTrialJanuaryUnlockMembershipForSurface("guide"), "PLUS");
assert.equal(getOrgTrialJanuaryUnlockMembershipForSurface("messaging"), "PLUS");
assert.equal(getOrgTrialJanuaryUnlockMembershipForSurface("recruiting"), "MEMBERSHIP");
assert.equal(getOrgTrialJanuaryUnlockMembershipForSurface("mixed"), "MEMBERSHIP");

assert.equal(getOrgTrialLockedContentMessage("playbook"), ORG_TRIAL_JANUARY_UNLOCK_PLUS_LABEL);
assert.equal(getOrgTrialLockedContentMessage("recruiting"), ORG_TRIAL_RECRUITING_LOCK_LABEL);
assert.equal(
  ORG_TRIAL_RECRUITING_LOCK_LABEL,
  "Included with All-Access or the 12-Week Program",
);
assert.doesNotMatch(ORG_TRIAL_RECRUITING_LOCK_LABEL, /January/i);
assert.doesNotMatch(ORG_TRIAL_RECRUITING_LOCK_LABEL, /\bmembership\b/i);
assert.equal(getOrgTrialLockedContentHref("recruiting"), ORG_TRIAL_RECRUITING_LOCK_HREF);
assert.equal(getOrgTrialLockedContentHref("recruiting"), "/program");

const expectedHref = isPublicMembershipLevelsEnabled() ? "/upgrade" : "/program";
assert.equal(getOrgTrialJanuaryMembershipHref(), expectedHref);
assert.equal(getOrgTrialLockedContentHref("playbook"), expectedHref);

console.log("test-org-trial-unlock-copy-shared: ok");
