import assert from "node:assert/strict";
import { getFreeSwingLandingCopy } from "../lib/free-swing-landing-shared";

function main() {
  const video = getFreeSwingLandingCopy("VIDEO");
  assert.equal(video.mode, "VIDEO");
  assert.match(video.headline, /Video Swing Breakdown/i);
  assert.ok(video.steps.some((step) => /video breakdown/i.test(step.title)));

  const written = getFreeSwingLandingCopy("WRITTEN_REPORT");
  assert.equal(written.mode, "WRITTEN_REPORT");
  assert.match(written.headline, /Free Swing Report/i);
  assert.ok(written.steps.some((step) => /written feedback/i.test(step.title)));
  assert.match(written.sampleHeading, /report/i);

  console.log("test-free-swing-landing-shared: all passed");
}

main();
