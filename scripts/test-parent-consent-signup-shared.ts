import assert from "node:assert/strict";
import { buildParentConsentConfirmEmail } from "../lib/parent-consent-email-shared";
import {
  hasPaidSignupCheckoutIntent,
  isParentAccountSignupCheckoutDeferralActive,
  needsUnder13ParentConfirmationLock,
  PARENT_ACCOUNT_SIGNUP_CHECKOUT_DEFERRAL_MS,
  PARENT_CONSENT_METHOD_ACCOUNT_SIGNUP,
  resolveUnder13ParentConsentGateMode,
  shouldFallbackDeferredParentAccountSignup,
} from "../lib/parent-consent-shared";

assert.equal(
  needsUnder13ParentConfirmationLock({
    playerAge: 12,
    parentConsentEmail: "parent@example.com",
    parentConsentConfirmedAt: null,
    accountRole: "PLAYER",
  }),
  true,
);

const termsAcceptedAt = new Date("2026-10-01T12:00:00.000Z");

assert.equal(
  needsUnder13ParentConfirmationLock({
    playerAge: 12,
    parentConsentEmail: "parent@example.com",
    parentConsentConfirmedAt: null,
    accountRole: "PARENT",
    parentConsentMethod: PARENT_CONSENT_METHOD_ACCOUNT_SIGNUP,
    termsAcceptedAt,
    now: new Date(termsAcceptedAt.getTime() + 60 * 60 * 1000),
  }),
  false,
);

assert.equal(
  needsUnder13ParentConfirmationLock({
    playerAge: 12,
    parentConsentEmail: "parent@example.com",
    parentConsentConfirmedAt: null,
    accountRole: "PARENT",
    parentConsentMethod: PARENT_CONSENT_METHOD_ACCOUNT_SIGNUP,
    termsAcceptedAt,
    now: new Date(termsAcceptedAt.getTime() + PARENT_ACCOUNT_SIGNUP_CHECKOUT_DEFERRAL_MS + 1),
  }),
  true,
);

assert.equal(
  shouldFallbackDeferredParentAccountSignup({
    accountRole: "PARENT",
    parentConsentMethod: PARENT_CONSENT_METHOD_ACCOUNT_SIGNUP,
    parentConsentConfirmedAt: null,
    termsAcceptedAt,
    reason: "checkout_canceled",
  }),
  true,
);

assert.equal(
  shouldFallbackDeferredParentAccountSignup({
    accountRole: "PARENT",
    parentConsentMethod: PARENT_CONSENT_METHOD_ACCOUNT_SIGNUP,
    parentConsentConfirmedAt: null,
    termsAcceptedAt,
    reason: "deferral_expired",
    now: new Date(termsAcceptedAt.getTime() + 60 * 60 * 1000),
  }),
  false,
);

assert.equal(
  isParentAccountSignupCheckoutDeferralActive({
    accountRole: "PARENT",
    parentConsentMethod: PARENT_CONSENT_METHOD_ACCOUNT_SIGNUP,
    parentConsentConfirmedAt: null,
    termsAcceptedAt,
    now: new Date(termsAcceptedAt.getTime() + PARENT_ACCOUNT_SIGNUP_CHECKOUT_DEFERRAL_MS - 1000),
  }),
  true,
);

assert.equal(
  needsUnder13ParentConfirmationLock({
    playerAge: 12,
    parentConsentEmail: "parent@example.com",
    parentConsentConfirmedAt: null,
    accountRole: "PARENT",
    parentConsentMethod: null,
  }),
  true,
);

assert.equal(
  resolveUnder13ParentConsentGateMode({
    needsUnder13ParentLock: true,
    accountRole: "PARENT",
  }),
  "parent_verify_email",
);

assert.equal(
  resolveUnder13ParentConsentGateMode({
    needsUnder13ParentLock: true,
    accountRole: "PLAYER",
  }),
  "player_waiting_on_parent",
);

assert.equal(hasPaidSignupCheckoutIntent({ pendingCheckoutLevel: "CORE" }), true);
assert.equal(hasPaidSignupCheckoutIntent({ signupSource: "program" }), true);
assert.equal(
  hasPaidSignupCheckoutIntent({ signupSource: "playbook", selectedMembershipTier: "BASIC" }),
  true,
);
assert.equal(hasPaidSignupCheckoutIntent({ signupSource: "playbook", selectedMembershipTier: "FREE" }), false);

const parentEmail = buildParentConsentConfirmEmail({
  userId: "u1",
  playerName: "Alex Example",
  playerEmail: "parent@example.com",
  agreedByName: "Pat Parent",
  agreedAt: new Date("2026-10-01T12:00:00.000Z"),
  audience: "parent_account_holder",
});
assert.match(parentEmail.subject, /Confirm your email to finish setting up Alex/);
assert.match(parentEmail.text, /Confirm your email to finish setting up Alex/);
assert.doesNotMatch(parentEmail.text, /so your parent can confirm/i);

const playerMinorEmail = buildParentConsentConfirmEmail({
  userId: "u2",
  playerName: "Alex Example",
  playerEmail: "player@example.com",
  agreedByName: "Pat Parent",
  agreedAt: new Date("2026-10-01T12:00:00.000Z"),
  audience: "third_party_parent",
});
assert.match(playerMinorEmail.subject, /Please confirm Alex/);

console.log("test-parent-consent-signup-shared: ok");
