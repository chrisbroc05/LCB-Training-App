import assert from "node:assert/strict";
import {
  formatWrittenReportLineForDisplay,
  normalizeWrittenReportLines,
  stripWrittenReportLinePrefix,
} from "../lib/written-report-line-shared";

assert.equal(stripWrittenReportLinePrefix("- Good load"), "Good load");
assert.equal(stripWrittenReportLinePrefix("* Strong base"), "Strong base");
assert.equal(stripWrittenReportLinePrefix("\u2022 - Double marker"), "Double marker");
assert.deepEqual(normalizeWrittenReportLines(["- One", "  * Two"]), ["One", "Two"]);
assert.equal(formatWrittenReportLineForDisplay("- Still clean"), "Still clean");

console.log("test-written-report-line-shared: ok");
