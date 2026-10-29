import type { CoachingReviewTrack } from "@prisma/client";

/** Admin / coach queue label for how this submission was paid for. */
export function formatCoachingReviewTrackAdminLabel(
  reviewTrack: CoachingReviewTrack | null | undefined,
): string | null {
  if (!reviewTrack) {
    return null;
  }
  switch (reviewTrack) {
    case "QUICK_SIX_WEEK":
      return "Core report";
    case "PLAYBOOK":
      return "Playbook breakdown";
    case "ORG_TRIAL_QUICK":
      return "Org trial report";
    case "FREE_ONCE":
      return "Free report";
    case "IN_DEPTH_MONTHLY":
      return "In-depth review";
    case "PROGRAM":
      return "Program submission";
    default:
      return null;
  }
}
