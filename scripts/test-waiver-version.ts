import assert from "node:assert/strict";
import { isTermsVersionOutdated } from "../lib/admin-agreements-shared";
import {
  isWaiverSignatureOutdated,
  WAIVER_VERSION,
} from "../lib/waiver-sign-shared";

function main() {
  assert.equal(isWaiverSignatureOutdated(WAIVER_VERSION), false);
  assert.equal(isWaiverSignatureOutdated("2026-10-21"), false);
  assert.equal(isWaiverSignatureOutdated("2026-03-01"), true);

  assert.equal(isTermsVersionOutdated("2026-10-21"), false);
  assert.equal(isTermsVersionOutdated("2026-09-29"), true);

  console.log("test-waiver-version: all passed");
}

main();
