import assert from "node:assert/strict";
import {
  formatTurnaroundDuration,
  parseAdminSentReportLevelFilter,
  reviewTrackForSentLevelFilter,
  fixItSlugToLabel,
} from "../lib/admin-sent-reports-shared";

assert.equal(formatTurnaroundDuration(45 * 60 * 1000), "45m");
assert.equal(formatTurnaroundDuration(90 * 60 * 1000), "1h 30m");
assert.equal(formatTurnaroundDuration(50 * 60 * 60 * 1000), "2d 2h");
assert.equal(formatTurnaroundDuration(-1), "--");

assert.equal(reviewTrackForSentLevelFilter("core"), "QUICK_SIX_WEEK");
assert.equal(reviewTrackForSentLevelFilter("org_trial"), "ORG_TRIAL_QUICK");
assert.equal(reviewTrackForSentLevelFilter("free"), "FREE_ONCE");
assert.equal(reviewTrackForSentLevelFilter("all"), null);

assert.equal(parseAdminSentReportLevelFilter("CORE"), "core");
assert.equal(parseAdminSentReportLevelFilter("nope"), "all");

assert.equal(fixItSlugToLabel("fixit-stay-closed"), "Stay Closed");
assert.equal(fixItSlugToLabel(null), null);

console.log("test-admin-sent-reports-shared: ok");
