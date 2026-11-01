import assert from "node:assert/strict";
import { formatCoachingReviewTrackAdminLabel } from "../lib/coaching-review-track-display-shared";

assert.equal(formatCoachingReviewTrackAdminLabel("IN_DEPTH_MONTHLY"), "In-depth review");
assert.equal(formatCoachingReviewTrackAdminLabel("EXTRA_REVIEW"), "Extra review");
assert.equal(formatCoachingReviewTrackAdminLabel(null), null);
assert.equal(formatCoachingReviewTrackAdminLabel(undefined), null);

console.log("test-coaching-review-track-display: ok");
