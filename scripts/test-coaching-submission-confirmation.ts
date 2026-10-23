import assert from "node:assert/strict";
import {
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
  assert.equal(shouldHideSwingResponsePreference("PLUS"), false);
  assert.equal(getMentalSubmissionConfirmationVariant("FREE"), "FREE");
  assert.equal(getMentalSubmissionConfirmationVariant("CORE"), "PREMIUM_VIDEO");
  console.log("test-coaching-submission-confirmation: all passed");
}

main();
