import assert from "node:assert/strict";
import {
  buildAdminOrgCommissionsHref,
  buildOrgFoundingOfferExplainer,
  formatAdminCommissionRate,
  isOrgCommissionConfigured,
} from "../lib/admin-organizations-shared";

assert.match(buildOrgFoundingOfferExplainer(12), /\$15\/mo for 12 months/);
assert.equal(formatAdminCommissionRate(0.15), "15%");
assert.equal(formatAdminCommissionRate(0.05), "5%");
assert.equal(isOrgCommissionConfigured(0), false);
assert.equal(isOrgCommissionConfigured(0.1), true);
assert.match(buildAdminOrgCommissionsHref("org_1"), /orgId=org_1/);

console.log("test-admin-organizations-shared: ok");
