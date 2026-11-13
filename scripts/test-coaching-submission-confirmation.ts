import assert from "node:assert/strict";
import {
  getForcedSwingResponsePreference,
  getMentalSubmissionConfirmationVariant,
  getSwingSubmissionConfirmationVariant,
  shouldHideSwingResponsePreference,
} from "../lib/coaching-submission-confirmation-shared";

function main() {
  assert.equal(getSwingSubmissionConfirmationVariant("CORE"), "WRITTEN_REPORT");
  assert.equal(getSwingSubmissionConfirmationVariant("ORG_TRIAL"), "WRITTEN_REPORT");
  assert.equal(getSwingSubmissionConfirmationVariant("FREE"), "FREE");
  assert.equal(getSwingSubmissionConfirmationVariant("PLUS"), "PREMIUM_VIDEO");
  assert.equal(shouldHideSwingResponsePreference("CORE"), true);
  assert.equal(shouldHideSwingResponsePreference("FREE"), true);
  assert.equal(shouldHideSwingResponsePreference("PLUS"), false);
  assert.equal(getForcedSwingResponsePreference("CORE"), "WRITTEN_RESPONSE");
  assert.equal(getForcedSwingResponsePreference("ORG_TRIAL"), "WRITTEN_RESPONSE");
  assert.equal(getForcedSwingResponsePreference("FREE", "VIDEO"), "VIDEO_RESPONSE");
  assert.equal(getForcedSwingResponsePreference("FREE", "WRITTEN_REPORT"), "WRITTEN_RESPONSE");
  assert.equal(getForcedSwingResponsePreference("PLUS"), null);
  assert.equal(getMentalSubmissionConfirmationVariant("FREE"), "FREE");
  assert.equal(getMentalSubmissionConfirmationVariant("CORE"), "PREMIUM_VIDEO");
  console.log("test-coaching-submission-confirmation: all passed");
}

main();
