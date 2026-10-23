import assert from "node:assert/strict";
import {
  buildWrittenReportResponseText,
  parseWrittenReportPaste,
} from "../lib/written-report-parse-shared";

const SAMPLE = `STRENGTHS:
Strong hand-eye coordination
Great attitude

AREAS TO IMPROVE:
Load into the back hip
Stay forward over the plate

RECOMMENDED DRILLS:
Angled tee drill
Top-hand isolation drill

NOTE FROM COACH BROC:
Thank you for trusting LCB Training. Keep working these drills this week.`;

function testParseSuccess() {
  const result = parseWrittenReportPaste(SAMPLE);
  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }
  assert.equal(result.sections.strengths.length, 2);
  assert.equal(result.sections.areasToImprove[0], "Load into the back hip");
  assert.equal(result.sections.recommendedDrills.length, 2);
  assert.ok(result.sections.noteFromCoach.includes("Thank you"));
}

function testMissingHeading() {
  const result = parseWrittenReportPaste("STRENGTHS:\nOne line only");
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.match(result.error, /Missing required heading/);
}

function testBuildResponseText() {
  const parsed = parseWrittenReportPaste(SAMPLE);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) {
    return;
  }
  const composite = buildWrittenReportResponseText(parsed.sections);
  assert.match(composite, /Strengths/);
  assert.match(composite, /Note from Coach Broc/);
}

function main() {
  testParseSuccess();
  testMissingHeading();
  testBuildResponseText();
  console.log("test-written-report-parse: all passed");
}

main();
