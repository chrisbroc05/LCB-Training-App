import assert from "node:assert/strict";
import {
  buildCoachSignupAlertEmailContent,
  buildCoachSignupDailyRollup,
  buildCoachSignupPushMessage,
  formatCoachSignupSourceLine,
} from "../lib/coach-signup-alert-shared";

const base = {
  userId: "u1",
  playerFirstName: "Jake",
  playerLastName: "Smith",
  playerAge: 12,
  accountRole: "PARENT" as const,
  accountEmail: "parent@example.com",
  accountHolderName: "Pat Smith",
  parentConsentName: "Pat Smith",
  parentConsentEmail: "parent@example.com",
  parentConsentConfirmedAt: null,
  organizationId: "org1",
  organizationName: "Northwest Travelers",
  orgTrialEndsAt: new Date("2026-12-31T12:00:00.000Z"),
  orgTrialActive: true,
  orgTeamName: null,
  pendingCheckoutLevel: null,
  signupSource: null,
  membershipTier: "FREE" as const,
  leadSource: null,
  leadFirstResourceSlug: null,
  signedUpAt: new Date("2026-11-04T18:00:00.000Z"),
  isTestAccount: false,
};

const clubNoTeam = { ...base };
assert.equal(formatCoachSignupSourceLine(clubNoTeam), "Club: Northwest Travelers");

const email = buildCoachSignupAlertEmailContent(clubNoTeam, "https://app.test");
assert.equal(email.subject, "New sign-up: Jake Smith (Northwest Travelers)");
assert.match(email.text, /Team: Not picked yet/);
assert.match(email.text, /Free trial \(through Dec 31\)/);
assert.match(email.text, /Under 13: Yes, waiting on parent confirmation/);
assert.match(email.text, /View in admin: https:\/\/app\.test\/admin\/players\/members\?member=u1/);

const clubWithTeam = { ...base, orgTeamName: "12U Gold" };
const pushClub = buildCoachSignupPushMessage(clubWithTeam, "https://app.test");
assert.equal(pushClub.title, "New Northwest Travelers sign-up: Jake Smith");
assert.equal(pushClub.body, "12U Gold - Free trial");

const freeSignup = {
  ...base,
  organizationId: null,
  organizationName: null,
  orgTrialActive: false,
  orgTrialEndsAt: null,
  orgTeamName: null,
  playerAge: 16,
  accountRole: "PLAYER" as const,
  leadFirstResourceSlug: "player-iq-quiz",
  leadSource: "resources",
};
assert.equal(formatCoachSignupSourceLine(freeSignup), "Lead from: quiz");
const pushFree = buildCoachSignupPushMessage(freeSignup, "https://app.test");
assert.equal(pushFree.title, "New free sign-up: Jake Smith");

const plusSignup = {
  ...freeSignup,
  leadFirstResourceSlug: null,
  leadSource: null,
  pendingCheckoutLevel: "PLUS" as const,
};
const pushPaid = buildCoachSignupPushMessage(plusSignup, "https://app.test");
assert.equal(pushPaid.title, "New Plus sign-up: Jake Smith");

const rollup = buildCoachSignupDailyRollup([
  clubWithTeam,
  clubWithTeam,
  freeSignup,
  plusSignup,
]);
assert.match(rollup.title, /4 new sign-ups/);
assert.match(rollup.title, /2 Northwest Travelers/);
assert.match(rollup.title, /1 free/);
assert.match(rollup.title, /1 Plus/);

console.log("test-coach-signup-alert-shared: ok");
