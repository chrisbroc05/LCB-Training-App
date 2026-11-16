import { PDFDocument } from "pdf-lib";
import { buildPlayerEvaluationCtaContent } from "../lib/player-evaluation-cta-shared";
import { KUREY_PLAYER_EVAL_FIXTURE } from "../lib/player-evaluation-pdf-kurey-fixture";
import { renderPlayerEvaluationPdfToBuffer } from "../lib/player-evaluation-pdf-node";

async function pageCountFor(buffer: Buffer) {
  const pdf = await PDFDocument.load(buffer);
  return pdf.getPageCount();
}

async function main() {
  const shortCta = buildPlayerEvaluationCtaContent({
    firstName: "Jonathan",
    reviewTrack: "QUICK_SIX_WEEK",
    coreNextEligibleAt: new Date("2026-10-07T12:00:00.000Z"),
  });

  const shortBuffer = await renderPlayerEvaluationPdfToBuffer({
    firstName: "Jonathan",
    lastName: "Kurey",
    teamLabel: KUREY_PLAYER_EVAL_FIXTURE.teamLabel,
    evalDateLabel: KUREY_PLAYER_EVAL_FIXTURE.evalDateLabel,
    strengths: KUREY_PLAYER_EVAL_FIXTURE.sections.strengths,
    areasToImprove: KUREY_PLAYER_EVAL_FIXTURE.sections.areasToImprove,
    recommendedDrills: KUREY_PLAYER_EVAL_FIXTURE.sections.recommendedDrills,
    noteFromCoach: KUREY_PLAYER_EVAL_FIXTURE.sections.noteFromCoach,
    cta: shortCta,
  });

  const shortPages = await pageCountFor(shortBuffer);
  if (shortPages !== 1) {
    throw new Error(`Short report expected 1 page, got ${shortPages}.`);
  }

  const longCta = buildPlayerEvaluationCtaContent({
    firstName: "Benjamin",
    reviewTrack: "QUICK_SIX_WEEK",
    recommendedFixItSlug: "fixit-stay-closed",
    coreNextEligibleAt: new Date("2026-12-28T12:00:00.000Z"),
  });

  const longBuffer = await renderPlayerEvaluationPdfToBuffer({
    firstName: "Benjamin",
    lastName: "Nakamura",
    teamLabel: "Northwest Travelers 12U",
    evalDateLabel: "November 16, 2026",
    strengths: [
      "Strong lower-half balance and posture through contact with no early hip slide",
      "Shows a quiet head and solid timing window against mid-velocity pitching",
      "Competitive at-bats: fights off tough pitches and stays in the zone late",
    ],
    areasToImprove: [
      "Front shoulder opens early on outside pitches, leaking barrel accuracy",
      "Hands cast slightly on the front side which lengthens the path to the ball",
    ],
    recommendedDrills: [
      "Low-and-away tee work: stay closed, drive the ball oppo for 3 rounds of 8 quality swings focusing on posture and a short path",
      "Top-hand connection drill with lead arm up, pause at contact, then finish tall for 2 sets of 10 controlled swings",
      "Front-shoulder closed stride holds: load, stride, freeze, then swing through a soft toss for 3 sets of 6",
    ],
    libraryDrills: [
      {
        title: "Coil into your load",
        href: "https://www.lcbtraining.com/drill-library?drill=1200422510",
      },
      {
        title: "Stop casting your hands",
        href: "https://www.lcbtraining.com/drill-library?drill=1200422514",
      },
    ],
    noteFromCoach:
      "Benjamin has a great foundation and the right mentality. The two adjustments above are very trainable, " +
      "and if he stacks daily reps on the drills linked in the app he should see cleaner contact over the next " +
      "few weeks. Keep filming the same drill angle so we can compare progress on the next report. Proud of " +
      "how hard he competes and how coachable he is in the cage.",
    cta: longCta,
  });

  const longPages = await pageCountFor(longBuffer);
  if (longPages < 1 || longPages > 2) {
    throw new Error(`Long report expected 1-2 pages, got ${longPages}.`);
  }

  // Extreme content should still never explode into multi-page CTA fragments.
  const extremeBuffer = await renderPlayerEvaluationPdfToBuffer({
    firstName: "Test",
    lastName: "Player",
    teamLabel: "LCB Training Demo Team With A Very Long Name",
    evalDateLabel: "November 16, 2026",
    strengths: Array.from({ length: 6 }, (_, index) =>
      `Strength ${index + 1}: detailed observation about balance, posture, timing, and barrel path with enough words to wrap.`,
    ),
    areasToImprove: Array.from({ length: 5 }, (_, index) =>
      `Area ${index + 1}: detailed coaching note that explains the fault and what better looks like in game swings.`,
    ),
    recommendedDrills: Array.from({ length: 5 }, (_, index) =>
      `Drill ${index + 1}: long written prescription with sets, reps, focus cues, and what good feels like after contact.`,
    ),
    libraryDrills: Array.from({ length: 4 }, (_, index) => ({
      title: `Library drill video title number ${index + 1}`,
      href: `https://www.lcbtraining.com/drill-library?drill=100000000${index}`,
    })),
    noteFromCoach:
      "Long note from Coach Broc. ".repeat(40).trim(),
    cta: longCta,
  });
  const extremePages = await pageCountFor(extremeBuffer);
  if (extremePages < 1 || extremePages > 2) {
    throw new Error(`Extreme report expected at most 2 pages, got ${extremePages}.`);
  }

  console.log(
    `test-player-evaluation-pdf: all passed (short=${shortPages}, long=${longPages}, extreme=${extremePages})`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
