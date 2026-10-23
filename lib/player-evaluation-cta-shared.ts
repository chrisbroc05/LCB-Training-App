/**
 * Player evaluation PDF platform CTA copy by review track (client-safe).
 */

import { isPublicMembershipLevelsEnabled } from "@/lib/membership-levels-shared";
import type { QuickWrittenReportTrack } from "@/lib/quick-written-report-shared";

export type PlayerEvaluationCtaTrack = QuickWrittenReportTrack | "PLAYBOOK" | "PROGRAM" | "IN_DEPTH_MONTHLY";

export function getPlayerEvaluationPlatformNoteHtml(
  firstName: string,
  reviewTrack: PlayerEvaluationCtaTrack,
): string {
  const name = firstName.trim() || "your player";
  const publicLevels = isPublicMembershipLevelsEnabled();

  if (reviewTrack === "FREE_ONCE") {
    return (
      `Between sessions, ${name} can keep developing with ` +
      `<b>The Next Level Playbook</b> and the full LCB Training online platform -- video drills, ` +
      `workout programs, and coaching tools built to support progress.<br/><br/>` +
      `Visit <b>lcbtraining.com</b> to explore the 12-Week Program and Playbook.`
    );
  }

  if (reviewTrack === "QUICK_SIX_WEEK") {
    if (publicLevels) {
      return (
        `Between reports, ${name} can keep building with drills, workouts, and guides in the app. ` +
        `When ready for more in-depth coaching, explore membership options at ` +
        `<b>lcbtraining.com</b>.`
      );
    }
    return (
      `Between reports, ${name} can keep developing with video drills, workout programs, and ` +
      `coaching tools in the LCB Training app.<br/><br/>` +
      `Visit <b>lcbtraining.com</b> to learn more about training with LCB.`
    );
  }

  if (reviewTrack === "ORG_TRIAL_QUICK") {
    if (publicLevels) {
      return (
        `During the team trial, ${name} can use drills and workouts in the app. ` +
        `Families can explore ongoing training options at <b>lcbtraining.com</b>.`
      );
    }
    return (
      `During the team trial, ${name} can keep developing with drills and workouts in the LCB Training app.<br/><br/>` +
      `Visit <b>lcbtraining.com</b> to learn more about training with LCB.`
    );
  }

  if (reviewTrack === "PROGRAM") {
    return (
      `Keep sending videos and check-ins through the 12-Week Program. Coach Broc and the full LCB ` +
      `Training platform are here to support ${name}'s progress.<br/><br/>` +
      `Visit <b>lcbtraining.com</b> anytime.`
    );
  }

  return (
    `Between sessions, ${name} can keep developing with ` +
    `<b>The Next Level Playbook</b> and the full LCB Training online platform -- video drills, ` +
    `workout programs, and coaching tools built to support progress.<br/><br/>` +
    `Visit <b>lcbtraining.com</b> to learn more.`
  );
}
