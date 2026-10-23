import { PDFDocument } from "pdf-lib";
import { buildPlayerEvaluationCtaContent } from "../lib/player-evaluation-cta-shared";
import { KUREY_PLAYER_EVAL_FIXTURE } from "../lib/player-evaluation-pdf-kurey-fixture";
import { renderPlayerEvaluationPdfToBuffer } from "../lib/player-evaluation-pdf-node";

async function main() {
  const cta = buildPlayerEvaluationCtaContent({
    firstName: "Jonathan",
    reviewTrack: "QUICK_SIX_WEEK",
    coreNextEligibleAt: new Date("2026-10-07T12:00:00.000Z"),
  });

  const buffer = await renderPlayerEvaluationPdfToBuffer({
    firstName: "Jonathan",
    lastName: "Kurey",
    teamLabel: KUREY_PLAYER_EVAL_FIXTURE.teamLabel,
    evalDateLabel: KUREY_PLAYER_EVAL_FIXTURE.evalDateLabel,
    strengths: KUREY_PLAYER_EVAL_FIXTURE.sections.strengths,
    areasToImprove: KUREY_PLAYER_EVAL_FIXTURE.sections.areasToImprove,
    recommendedDrills: KUREY_PLAYER_EVAL_FIXTURE.sections.recommendedDrills,
    noteFromCoach: KUREY_PLAYER_EVAL_FIXTURE.sections.noteFromCoach,
    cta,
  });

  if (buffer.length < 500) {
    throw new Error("Generated PDF buffer is unexpectedly small.");
  }

  const pdf = await PDFDocument.load(buffer);
  const pageCount = pdf.getPageCount();
  if (pageCount !== 1) {
    throw new Error(`Expected 1 page, got ${pageCount}.`);
  }

  console.log("test-player-evaluation-pdf: all passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
