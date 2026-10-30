import assert from "node:assert/strict";

import {
  isAdminMarketingExcludedLeadEmail,
  normalizeEmailForAdminAliasMatch,
} from "../lib/lead-marketing-shared";

assert.equal(
  normalizeEmailForAdminAliasMatch("ChrisBroc05+Newsletter@gmail.com"),
  "chrisbroc05@gmail.com",
);
assert.equal(
  isAdminMarketingExcludedLeadEmail(
    "chrisbroc05+anything@gmail.com",
    "chrisbroc05@gmail.com",
  ),
  true,
);
assert.equal(
  isAdminMarketingExcludedLeadEmail("other@gmail.com", "chrisbroc05@gmail.com"),
  false,
);
assert.equal(isAdminMarketingExcludedLeadEmail("chrisbroc05@gmail.com", "chrisbroc05@gmail.com"), true);

console.log("test-lead-marketing-shared: all passed");
