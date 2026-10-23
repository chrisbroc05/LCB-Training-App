/**
 * Reference evaluation content matching docs/samples/LCB_Eval_Kurey.pdf (for local samples/tests).
 */

import type { WrittenReportSections } from "@/lib/written-report-parse-shared";

export const KUREY_PLAYER_EVAL_FIXTURE = {
  playerName: "Jonathan Kurey",
  teamLabel: "Northwest Travelers 12U",
  evalDateLabel: "August 26, 2026",
  sections: {
    strengths: [
      "Exceptional lower half movement with great balance behind the front foot",
      "Stacked and connected posture through the swing with no hip drift",
      "Strong power for his age and stage",
      "Good barrel accuracy",
    ],
    areasToImprove: [
      "Front shoulder tends to fly out during the swing",
      "Hands are long with a casting motion similar to a golf swing, causing his head to pull off the ball",
      "Focus on creating a quicker, more connected upper half",
    ],
    recommendedDrills: [
      "Low-and-away tee drill focused on driving the ball to the opposite field to train a closed front shoulder and strong posture over the plate",
      "Top-hand-only swing drill with the lead arm held up to build connection and shorten the swing path",
    ],
    noteFromCoach:
      "Jonathan has a lot to be excited about. His athleticism and coachability stood out right away, and he is " +
      "already building habits that will serve him well as he keeps growing. The areas noted above are very " +
      "workable, and with consistent reps on the recommended drills, he can make meaningful progress quickly. " +
      "Thank you to the Kurey family for trusting LCB Training with Jonathan's development -- and to his coaches " +
      "for the support around him. We would love to keep training together and help him take the next step. " +
      "Please reach out anytime.",
  } satisfies WrittenReportSections,
};
