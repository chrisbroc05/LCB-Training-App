import assert from "node:assert/strict";
import {
  formatMediaConsentLabel,
  resolveMediaDisplayStatus,
} from "../lib/media-consent-shared";
import { buildMediaPolicyUpdateEmailBodyText } from "../lib/media-policy-update-email-shared";
import { MEDIA_CONSENT_OPTION_NO, MEDIA_CONSENT_OPTION_YES } from "../lib/media-consent-shared";

assert.equal(
  resolveMediaDisplayStatus({ mediaConsent: true, mediaOptOutAll: false }),
  "YES",
);
assert.equal(
  resolveMediaDisplayStatus({ mediaConsent: false, mediaOptOutAll: false }),
  "GROUP_ONLY",
);
assert.equal(
  resolveMediaDisplayStatus({ mediaConsent: true, mediaOptOutAll: true }),
  "KEEP_OUT",
);
assert.equal(formatMediaConsentLabel({ mediaConsent: false, mediaOptOutAll: false }), "Group only");

const emailBody = buildMediaPolicyUpdateEmailBodyText("Jordan");
assert.match(emailBody, /Group training videos/);
assert.match(emailBody, /Your choice of "No"/);
assert.match(MEDIA_CONSENT_OPTION_YES, /close-ups/);
assert.match(MEDIA_CONSENT_OPTION_NO, /group footage only/i);

console.log("test-media-consent-shared: ok");
