import assert from "node:assert/strict";
import { buildCoachSubmissionNotificationEmailContent } from "../lib/coach-submission-notification-email";

function main() {
  const written = buildCoachSubmissionNotificationEmailContent({
    submissionId: "sub-written",
    submissionTab: "swing",
    notificationKind: "WRITTEN_REPORT",
    effectivePlanLabel: "Core",
    firstName: "Jamie",
    fullName: "Jamie Lee",
    membershipTier: "BASIC",
    note: "Need help with load.",
    submittedAt: new Date("2026-10-26T12:00:00Z"),
  });

  assert.match(written.subject, /Swing report requested/);
  assert.match(written.text, /Core/);
  assert.match(written.text, /Report requested/);
  assert.doesNotMatch(written.text, /Respond by/);
  assert.match(written.text, /coaching%2Freports/);
  assert.match(written.text, /submissionId%3Dsub-written/);

  const video = buildCoachSubmissionNotificationEmailContent({
    submissionId: "sub-video",
    submissionTab: "swing",
    notificationKind: "VIDEO_REVIEW",
    effectivePlanLabel: "All-Access",
    firstName: "Alex",
    fullName: "Alex Rivera",
    membershipTier: "ELITE",
    note: "Timing on offspeed.",
    submittedAt: new Date("2026-10-26T12:00:00Z"),
  });

  assert.match(video.subject, /New video from Alex/);
  assert.match(video.text, /All-Access/);
  assert.match(video.text, /Respond by/);
  assert.match(video.text, /coaching%2Freviews/);

  console.log("test-coach-submission-notification-email: all passed");
}

main();
