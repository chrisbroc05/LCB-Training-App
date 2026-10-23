/**
 * Generates Node sample PDFs and side-by-side PNGs vs docs/samples/LCB_Eval_Kurey.pdf (FREE and CORE CTAs).
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import {
  buildPlayerEvaluationCtaContent,
  type PlayerEvaluationCtaTrack,
} from "../lib/player-evaluation-cta-shared";
import { KUREY_PLAYER_EVAL_FIXTURE } from "../lib/player-evaluation-pdf-kurey-fixture";
import { renderPlayerEvaluationPdfToBuffer } from "../lib/player-evaluation-pdf-node";

const samplesDir = path.join(process.cwd(), "docs/samples");
const referencePdf = path.join(samplesDir, "LCB_Eval_Kurey.pdf");
const thumbDir = path.join(samplesDir, ".comparison-thumbs");

function pdfToPng(pdfPath: string, prefix: string) {
  fs.mkdirSync(thumbDir, { recursive: true });
  execFileSync("qlmanage", ["-t", "-s", "1600", "-o", thumbDir, pdfPath], {
    stdio: "pipe",
  });
  const base = path.basename(pdfPath);
  const generated = path.join(thumbDir, `${base}.png`);
  if (!fs.existsSync(generated)) {
    throw new Error(`Thumbnail not created for ${pdfPath}`);
  }
  const target = path.join(thumbDir, `${prefix}.png`);
  fs.renameSync(generated, target);
  return target;
}

async function buildSamplePdf(reviewTrack: PlayerEvaluationCtaTrack) {
  const cta = buildPlayerEvaluationCtaContent({
    firstName: "Jonathan",
    reviewTrack,
    coreNextEligibleAt:
      reviewTrack === "QUICK_SIX_WEEK" ? new Date("2026-10-07T12:00:00.000Z") : null,
    orgTrialEndsAt: reviewTrack === "ORG_TRIAL_QUICK" ? new Date("2026-11-15T12:00:00.000Z") : null,
  });

  return renderPlayerEvaluationPdfToBuffer({
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
}

async function writeComparison(params: {
  label: string;
  nodePdfPath: string;
  comparisonPngPath: string;
  refPrefix: string;
  nodePrefix: string;
}) {
  const nodeBuffer = await buildSamplePdf(
    params.label === "FREE" ? "FREE_ONCE" : "QUICK_SIX_WEEK",
  );
  fs.writeFileSync(params.nodePdfPath, nodeBuffer);

  const refPng = pdfToPng(referencePdf, `${params.refPrefix}-ref`);
  const nodePng = pdfToPng(params.nodePdfPath, `${params.nodePrefix}-node`);

  const refMeta = await sharp(refPng).metadata();
  const nodeMeta = await sharp(nodePng).metadata();
  const height = Math.max(refMeta.height ?? 0, nodeMeta.height ?? 0);
  const labelHeight = 48;
  const gap = 16;
  const panelWidth = Math.max(refMeta.width ?? 0, nodeMeta.width ?? 0);
  const totalWidth = panelWidth * 2 + gap;
  const totalHeight = height + labelHeight;

  const refResized = await sharp(refPng)
    .resize({ width: panelWidth, height, fit: "contain", background: "#ffffff" })
    .png()
    .toBuffer();
  const nodeResized = await sharp(nodePng)
    .resize({ width: panelWidth, height, fit: "contain", background: "#ffffff" })
    .png()
    .toBuffer();

  const labelSvg = (text: string, x: number) => `
    <text x="${x + panelWidth / 2}" y="32" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="600" fill="#0A1628" text-anchor="middle">${text}</text>
  `;

  const svgLabels = `
    <svg width="${totalWidth}" height="${labelHeight}">
      ${labelSvg("Reference (legacy CTA)", 0)}
      ${labelSvg(`Node (${params.label} CTA)`, panelWidth + gap)}
    </svg>
  `;

  await sharp({
    create: {
      width: totalWidth,
      height: totalHeight,
      channels: 3,
      background: "#ffffff",
    },
  })
    .composite([
      { input: Buffer.from(svgLabels), top: 0, left: 0 },
      { input: refResized, top: labelHeight, left: 0 },
      { input: nodeResized, top: labelHeight, left: panelWidth + gap },
    ])
    .png()
    .toFile(params.comparisonPngPath);

  console.log(`Wrote ${params.nodePdfPath}`);
  console.log(`Wrote ${params.comparisonPngPath}`);
}

async function main() {
  if (!fs.existsSync(referencePdf)) {
    throw new Error(`Missing reference PDF: ${referencePdf}`);
  }

  await writeComparison({
    label: "FREE",
    nodePdfPath: path.join(samplesDir, "LCB_Eval_Kurey_CTA_FREE.pdf"),
    comparisonPngPath: path.join(samplesDir, "LCB_Eval_comparison_FREE.png"),
    refPrefix: "free",
    nodePrefix: "free",
  });

  await writeComparison({
    label: "CORE",
    nodePdfPath: path.join(samplesDir, "LCB_Eval_Kurey_CTA_CORE.pdf"),
    comparisonPngPath: path.join(samplesDir, "LCB_Eval_comparison_CORE.png"),
    refPrefix: "core",
    nodePrefix: "core",
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
