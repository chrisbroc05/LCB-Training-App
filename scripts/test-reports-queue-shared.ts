import assert from "node:assert/strict";
import { getReportsQueueReviewTracks } from "../lib/reports-queue-shared";

function main() {
  const video = getReportsQueueReviewTracks("VIDEO");
  assert.deepEqual(video, ["QUICK_SIX_WEEK", "ORG_TRIAL_QUICK"]);
  assert.ok(!video.includes("FREE_ONCE"));

  const written = getReportsQueueReviewTracks("WRITTEN_REPORT");
  assert.deepEqual(written, ["QUICK_SIX_WEEK", "ORG_TRIAL_QUICK", "FREE_ONCE"]);

  console.log("test-reports-queue-shared: all passed");
}

main();
