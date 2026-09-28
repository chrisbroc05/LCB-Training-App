import "server-only";

import { buildSubmissionResponseProfilePath } from "@/lib/email-layout";
import { sendPushToUserSafe } from "@/lib/push-send";

export async function sendCoachResponsePush(params: {
  userId: string;
  submissionType: "SWING_ANALYSIS" | "MENTAL_GAME";
  submissionId: string | number;
}) {
  const path = buildSubmissionResponseProfilePath(
    params.submissionType,
    String(params.submissionId),
  );

  return sendPushToUserSafe(
    params.userId,
    {
      title: "Coach Broc responded to your video",
      body: "Your feedback is ready to review.",
      url: path,
    },
    {
      type: "COACH_RESPONSE",
      dedupeKey: `${params.userId}:COACH_RESPONSE:${params.submissionType}:${params.submissionId}`,
      skipDedupeCheck: true,
    },
  );
}

export async function sendPlanUpdatePush(params: {
  userId: string;
  enrollmentId: string;
  dedupeSuffix: string;
}) {
  return sendPushToUserSafe(
    params.userId,
    {
      title: "Coach Broc added something to your plan",
      body: "Open Today to see what changed.",
      url: "/dashboard/today",
    },
    {
      type: "PLAN_UPDATE",
      dedupeKey: `${params.userId}:PLAN_UPDATE:${params.enrollmentId}:${params.dedupeSuffix}`,
      skipDedupeCheck: true,
    },
  );
}
