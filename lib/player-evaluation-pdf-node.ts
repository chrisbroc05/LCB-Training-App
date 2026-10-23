/**
 * Pure Node player evaluation PDF (pdfkit). Used at runtime on Render and in local sample scripts.
 */

import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import { formatWrittenReportLineForDisplay } from "@/lib/written-report-line-shared";
import type { PlayerEvaluationCtaContent } from "@/lib/player-evaluation-cta-shared";
import {
  PLAYER_EVAL_LOGO_RELATIVE_PATH,
  PLAYER_EVAL_PDF_COLORS,
  PLAYER_EVAL_PDF_LAYOUT,
} from "@/lib/player-evaluation-pdf-layout-shared";

const CTA_BOX_PAD_X = 12;
const CTA_BOX_PAD_Y = 14;
const CTA_OFFER_TITLE_SIZE = 9.5;
const CTA_OFFER_BODY_SIZE = 8.5;
const CTA_HEADING_SIZE = 11;
const CTA_URL_SIZE = 9.5;
const CTA_COLUMN_GUTTER = 22;
const CTA_TITLE_BODY_GAP = 6;
const CTA_SECTION_BODY_TEXT_PAD = 10;

export type PlayerEvaluationPdfInput = {
  firstName: string;
  lastName: string;
  teamLabel: string;
  evalDateLabel: string;
  strengths: string[];
  areasToImprove: string[];
  recommendedDrills: string[];
  noteFromCoach: string;
  cta: PlayerEvaluationCtaContent;
  projectRoot?: string;
};

type PdfDoc = InstanceType<typeof PDFDocument>;

function resolveLogoPath(projectRoot: string) {
  const logoPath = path.join(projectRoot, PLAYER_EVAL_LOGO_RELATIVE_PATH);
  return fs.existsSync(logoPath) ? logoPath : null;
}

function contentOriginX() {
  return PLAYER_EVAL_PDF_LAYOUT.marginLeft;
}

function contentWidth() {
  return PLAYER_EVAL_PDF_LAYOUT.contentWidth;
}

function measureOfferBlock(
  doc: PdfDoc,
  cta: PlayerEvaluationCtaContent,
  textWidth: number,
  useColumns: boolean,
) {
  let offersHeight = 0;
  const count = cta.offers.length;
  if (count === 0) {
    return 0;
  }

  if (useColumns) {
    const colWidth = (textWidth - CTA_COLUMN_GUTTER * (count - 1)) / count;
    for (const offer of cta.offers) {
      doc.font("Helvetica-Bold").fontSize(CTA_OFFER_TITLE_SIZE);
      const titleH = doc.heightOfString(offer.title, { width: colWidth, lineGap: 1 });
      doc.font("Helvetica").fontSize(CTA_OFFER_BODY_SIZE);
      const bodyH = doc.heightOfString(offer.body, { width: colWidth, lineGap: 1.5 });
      offersHeight = Math.max(offersHeight, titleH + CTA_TITLE_BODY_GAP + bodyH);
    }
    return offersHeight;
  }

  for (let index = 0; index < cta.offers.length; index += 1) {
    const offer = cta.offers[index]!;
    doc.font("Helvetica-Bold").fontSize(CTA_OFFER_TITLE_SIZE);
    const titleH = doc.heightOfString(offer.title, { width: textWidth, lineGap: 1 });
    doc.font("Helvetica").fontSize(CTA_OFFER_BODY_SIZE);
    const bodyH = doc.heightOfString(offer.body, { width: textWidth, lineGap: 1.5 });
    offersHeight += titleH + CTA_TITLE_BODY_GAP + bodyH;
    if (index < cta.offers.length - 1) {
      offersHeight += 6;
    }
  }
  return offersHeight;
}

function shouldUseCtaColumns(offerCount: number) {
  return offerCount >= 2;
}

function measureCtaUrlLineHeight(doc: PdfDoc) {
  doc.font("Helvetica-Bold").fontSize(CTA_URL_SIZE);
  return doc.currentLineHeight(true);
}

function measureCtaBoxHeight(doc: PdfDoc, cta: PlayerEvaluationCtaContent, boxWidth: number) {
  const innerWidth = boxWidth - CTA_BOX_PAD_X * 2;
  const textWidth = innerWidth;

  doc.font("Helvetica-Bold").fontSize(CTA_HEADING_SIZE);
  const headingH = doc.heightOfString(cta.heading, { width: textWidth, lineGap: 0 });

  const useColumns = shouldUseCtaColumns(cta.offers.length);
  const offersH = measureOfferBlock(doc, cta, textWidth, useColumns);
  const urlH = measureCtaUrlLineHeight(doc);

  return CTA_BOX_PAD_Y + headingH + 10 + offersH + 10 + urlH + CTA_BOX_PAD_Y;
}

function drawCtaBox(doc: PdfDoc, x: number, y: number, width: number, cta: PlayerEvaluationCtaContent) {
  const { navy, white } = PLAYER_EVAL_PDF_COLORS;
  const accentGreen = PLAYER_EVAL_PDF_COLORS.lightGreen;
  const boxHeight = measureCtaBoxHeight(doc, cta, width);

  doc.save();
  doc.rect(x, y, width, boxHeight).fill(navy);

  const innerX = x + CTA_BOX_PAD_X;
  const textWidth = width - CTA_BOX_PAD_X * 2;
  let cursorY = y + CTA_BOX_PAD_Y;

  doc.fillColor(white).font("Helvetica-Bold").fontSize(CTA_HEADING_SIZE);
  doc.text(cta.heading, innerX, cursorY, { width: textWidth, lineGap: 0 });
  cursorY += doc.heightOfString(cta.heading, { width: textWidth, lineGap: 0 }) + 10;

  const useColumns = shouldUseCtaColumns(cta.offers.length);
  if (useColumns) {
    const count = cta.offers.length;
    const colWidth = (textWidth - CTA_COLUMN_GUTTER * (count - 1)) / count;
    let maxColHeight = 0;

    for (const offer of cta.offers) {
      doc.font("Helvetica-Bold").fontSize(CTA_OFFER_TITLE_SIZE);
      const titleH = doc.heightOfString(offer.title, { width: colWidth, lineGap: 1 });
      doc.font("Helvetica").fontSize(CTA_OFFER_BODY_SIZE);
      const bodyH = doc.heightOfString(offer.body, { width: colWidth, lineGap: 1.5 });
      const colH = titleH + CTA_TITLE_BODY_GAP + bodyH;
      maxColHeight = Math.max(maxColHeight, colH);
    }

    for (let index = 0; index < cta.offers.length; index += 1) {
      const offer = cta.offers[index]!;
      const colX = innerX + index * (colWidth + CTA_COLUMN_GUTTER);
      doc.fillColor(accentGreen).font("Helvetica-Bold").fontSize(CTA_OFFER_TITLE_SIZE);
      doc.text(offer.title, colX, cursorY, { width: colWidth, lineGap: 1 });
      const titleH = doc.heightOfString(offer.title, { width: colWidth, lineGap: 1 });
      doc.fillColor(white).font("Helvetica").fontSize(CTA_OFFER_BODY_SIZE);
      doc.text(offer.body, colX, cursorY + titleH + CTA_TITLE_BODY_GAP, {
        width: colWidth,
        lineGap: 1.5,
      });
    }
    cursorY += maxColHeight + 10;
  } else if (cta.offers.length === 1) {
    const offer = cta.offers[0]!;
    doc.fillColor(accentGreen).font("Helvetica-Bold").fontSize(CTA_OFFER_TITLE_SIZE);
    doc.text(offer.title, innerX, cursorY, { width: textWidth, lineGap: 1 });
    const titleH = doc.heightOfString(offer.title, { width: textWidth, lineGap: 1 });
    doc.fillColor(white).font("Helvetica").fontSize(CTA_OFFER_BODY_SIZE);
    doc.text(offer.body, innerX, cursorY + titleH + CTA_TITLE_BODY_GAP, {
      width: textWidth,
      lineGap: 1.5,
    });
    const bodyH = doc.heightOfString(offer.body, { width: textWidth, lineGap: 1.5 });
    cursorY += titleH + CTA_TITLE_BODY_GAP + bodyH + 10;
  }

  doc.fillColor(white).font("Helvetica-Bold").fontSize(CTA_URL_SIZE);
  doc.text(cta.urlLabel, innerX, cursorY, { lineBreak: false });

  doc.restore();
  return boxHeight;
}

function bulletTextWidth(cellWidth: number) {
  return cellWidth - CTA_SECTION_BODY_TEXT_PAD * 2;
}

function measureBulletList(
  doc: PdfDoc,
  items: string[],
  cellWidth: number,
  fontSize: number,
  lineGap: number,
) {
  doc.font("Helvetica").fontSize(fontSize);
  const textWidth = bulletTextWidth(cellWidth);
  let total = 0;
  for (const item of items) {
    const bullet = `\u2022 ${formatWrittenReportLineForDisplay(item)}`;
    total += doc.heightOfString(bullet, { width: textWidth, lineGap }) + 2;
  }
  return total + 4;
}

function drawBulletList(
  doc: PdfDoc,
  items: string[],
  x: number,
  y: number,
  cellWidth: number,
  fontSize: number,
  lineGap: number,
  color: string,
) {
  doc.fillColor(color).font("Helvetica").fontSize(fontSize);
  const textWidth = bulletTextWidth(cellWidth);
  let cursorY = y;
  for (const item of items) {
    const bullet = `\u2022 ${formatWrittenReportLineForDisplay(item)}`;
    doc.text(bullet, x + CTA_SECTION_BODY_TEXT_PAD, cursorY, { width: textWidth, lineGap });
    cursorY += doc.heightOfString(bullet, { width: textWidth, lineGap }) + 2;
  }
  return cursorY;
}

function measureNoteParagraph(
  doc: PdfDoc,
  text: string,
  width: number,
  fontSize: number,
  lineGap: number,
) {
  doc.font("Helvetica-Oblique").fontSize(fontSize);
  return doc.heightOfString(text, { width: width - 20, lineGap }) + 4;
}

function drawNoteParagraph(
  doc: PdfDoc,
  text: string,
  x: number,
  y: number,
  width: number,
  fontSize: number,
  lineGap: number,
  color: string,
) {
  doc.fillColor(color).font("Helvetica-Oblique").fontSize(fontSize);
  doc.text(text, x + 10, y, { width: width - 20, lineGap });
  const h = doc.heightOfString(text, { width: width - 20, lineGap });
  return y + h + 4;
}

type SectionSpec = {
  title: string;
  kind: "bullets" | "note";
  bullets?: string[];
  note?: string;
};

function measureSectionCell(doc: PdfDoc, width: number, spec: SectionSpec) {
  const headerHeight = 30;
  const innerWidth = width - PLAYER_EVAL_PDF_LAYOUT.sectionLeftBarWidth;
  let bodyContentHeight = 0;
  if (spec.kind === "bullets" && spec.bullets) {
    bodyContentHeight = measureBulletList(doc, spec.bullets, width, 9.5, 2);
  } else if (spec.kind === "note" && spec.note) {
    bodyContentHeight = measureNoteParagraph(doc, spec.note, width, 10, 3);
  }
  const bodyHeight =
    bodyContentHeight + PLAYER_EVAL_PDF_LAYOUT.sectionBodyPadding * 2;
  return headerHeight + bodyHeight;
}

function drawSectionCell(
  doc: PdfDoc,
  x: number,
  y: number,
  width: number,
  spec: SectionSpec,
  bodyHeightOverride?: number,
) {
  const { navy, green, lightGreen, lightGray, white } = PLAYER_EVAL_PDF_COLORS;
  const headerHeight = 30;
  const innerX = x + PLAYER_EVAL_PDF_LAYOUT.sectionLeftBarWidth;
  const innerWidth = width - PLAYER_EVAL_PDF_LAYOUT.sectionLeftBarWidth;

  let bodyContentHeight = 0;
  if (spec.kind === "bullets" && spec.bullets) {
    bodyContentHeight = measureBulletList(doc, spec.bullets, width, 9.5, 2);
  } else if (spec.kind === "note" && spec.note) {
    bodyContentHeight = measureNoteParagraph(doc, spec.note, width, 10, 3);
  }

  const bodyHeight =
    bodyHeightOverride ??
    bodyContentHeight + PLAYER_EVAL_PDF_LAYOUT.sectionBodyPadding * 2;
  const totalHeight = headerHeight + bodyHeight;

  doc.save();
  doc.lineWidth(PLAYER_EVAL_PDF_LAYOUT.sectionBorderWidth).strokeColor(lightGreen);
  doc.rect(x, y, width, totalHeight).stroke();

  doc.rect(x, y, PLAYER_EVAL_PDF_LAYOUT.sectionLeftBarWidth, totalHeight).fill(green);

  doc.rect(innerX, y, innerWidth, headerHeight).fill(navy);
  doc
    .fillColor(white)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(spec.title, innerX + 10, y + 8, { width: innerWidth - 20 });

  doc.rect(x, y + headerHeight, width, bodyHeight).fill(lightGray);

  const bodyY = y + headerHeight + PLAYER_EVAL_PDF_LAYOUT.sectionBodyPadding;
  if (spec.kind === "bullets" && spec.bullets) {
    drawBulletList(doc, spec.bullets, x, bodyY, width, 9.5, 2, navy);
  } else if (spec.kind === "note" && spec.note) {
    drawNoteParagraph(doc, spec.note, x, bodyY, width, 10, 3, navy);
  }

  doc.restore();
  return totalHeight;
}

function drawHorizontalRule(doc: PdfDoc, y: number) {
  const x = contentOriginX();
  const w = contentWidth();
  doc
    .save()
    .strokeColor(PLAYER_EVAL_PDF_COLORS.lightGreen)
    .lineWidth(PLAYER_EVAL_PDF_LAYOUT.hrThickness)
    .lineCap("round")
    .moveTo(x, y)
    .lineTo(x + w, y)
    .stroke()
    .restore();
}

function drawLogo(doc: PdfDoc, projectRoot: string, y: number) {
  const logoPath = resolveLogoPath(projectRoot);
  const centerX = contentOriginX() + contentWidth() / 2;
  if (!logoPath) {
    const w = contentWidth();
    const h = 36;
    const x = contentOriginX();
    doc.rect(x, y, w, h).fill(PLAYER_EVAL_PDF_COLORS.navy);
    doc
      .fillColor(PLAYER_EVAL_PDF_COLORS.white)
      .font("Helvetica-Bold")
      .fontSize(13)
      .text("LCB TRAINING", x, y + 10, { width: w, align: "center" });
    return y + h;
  }

  const maxW = PLAYER_EVAL_PDF_LAYOUT.logoMaxWidth;
  const maxH = PLAYER_EVAL_PDF_LAYOUT.logoMaxHeight;
  doc.image(logoPath, centerX - maxW / 2, y, {
    fit: [maxW, maxH],
    align: "center",
  });
  return y + maxH;
}

export function renderPlayerEvaluationPdfToBuffer(input: PlayerEvaluationPdfInput): Promise<Buffer> {
  const projectRoot = input.projectRoot ?? process.cwd();
  const { navy, green, white } = PLAYER_EVAL_PDF_COLORS;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: {
        top: PLAYER_EVAL_PDF_LAYOUT.marginTop,
        bottom: PLAYER_EVAL_PDF_LAYOUT.marginBottom,
        left: PLAYER_EVAL_PDF_LAYOUT.marginLeft,
        right: PLAYER_EVAL_PDF_LAYOUT.marginRight,
      },
      autoFirstPage: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const fullName = [input.firstName, input.lastName].filter(Boolean).join(" ");
    let y = PLAYER_EVAL_PDF_LAYOUT.marginTop;

    y = drawLogo(doc, projectRoot, y);
    y += 4;

    doc
      .fillColor(navy)
      .font("Helvetica-Bold")
      .fontSize(20)
      .text("Player Evaluation Report", contentOriginX(), y, {
        width: contentWidth(),
        align: "center",
      });
    y += 23;

    doc
      .fillColor(green)
      .font("Helvetica-BoldOblique")
      .fontSize(12)
      .text('"Work Hard. Be Memorable."', contentOriginX(), y, {
        width: contentWidth(),
        align: "center",
      });
    y += 14 + 6;

    const metaLine = `${fullName}  |  ${input.teamLabel}  |  ${input.evalDateLabel}`;
    doc.font("Helvetica-Bold").fontSize(10);
    const metaBoldWidth = doc.widthOfString(fullName);
    doc.font("Helvetica").fontSize(10);
    const metaRest = `  |  ${input.teamLabel}  |  ${input.evalDateLabel}`;
    const metaTotalWidth = metaBoldWidth + doc.widthOfString(metaRest);
    const metaX = contentOriginX() + (contentWidth() - metaTotalWidth) / 2;
    doc.font("Helvetica-Bold").fontSize(10).fillColor(navy).text(fullName, metaX, y, { continued: true });
    doc.font("Helvetica").text(metaRest, { continued: false });
    y += 12 + 6;

    drawHorizontalRule(doc, y);
    y += 6;

    const colW = PLAYER_EVAL_PDF_LAYOUT.columnWidth;
    const leftSpec: SectionSpec = {
      title: "Strengths",
      kind: "bullets",
      bullets: input.strengths,
    };
    const rightSpec: SectionSpec = {
      title: "Areas to Improve",
      kind: "bullets",
      bullets: input.areasToImprove,
    };

    const leftH = measureSectionCell(doc, colW, leftSpec);
    const rightH = measureSectionCell(doc, colW, rightSpec);
    const rowH = Math.max(leftH, rightH);
    const leftBodyOverride = rowH - 30;
    const rightBodyOverride = rowH - 30;

    drawSectionCell(doc, contentOriginX(), y, colW, leftSpec, leftBodyOverride);
    drawSectionCell(doc, contentOriginX() + colW, y, colW, rightSpec, rightBodyOverride);
    y += rowH + 5;

    const drillsSpec: SectionSpec = {
      title: "Recommended Drills",
      kind: "bullets",
      bullets: input.recommendedDrills,
    };
    const drillsH = measureSectionCell(doc, contentWidth(), drillsSpec);
    drawSectionCell(doc, contentOriginX(), y, contentWidth(), drillsSpec);
    y += drillsH + 5;

    const noteSpec: SectionSpec = {
      title: "Note from Coach Broc",
      kind: "note",
      note: input.noteFromCoach,
    };
    const noteH = measureSectionCell(doc, contentWidth(), noteSpec);
    drawSectionCell(doc, contentOriginX(), y, contentWidth(), noteSpec);
    y += noteH + 5;

    const ctaHeight = drawCtaBox(doc, contentOriginX(), y, contentWidth(), input.cta);
    y += ctaHeight + 5;

    const footerPad = 8;
    const footerColW = colW;
    const leftFooter =
      "Coach Broccolino\nEmail: chrisbroc05@gmail.com\nPhone: 847-208-9661";
    const rightFooter =
      "LCB Training\nWebsite: lcbtraining.com\nInstagram: @lcbtraining | TikTok: @cbroc05";
    doc.font("Helvetica").fontSize(9.5);
    const leftFooterH = doc.heightOfString(leftFooter, { width: footerColW - 20, align: "center" });
    const rightFooterH = doc.heightOfString(rightFooter, { width: footerColW - 20, align: "center" });
    const footerHeight = Math.max(leftFooterH, rightFooterH) + footerPad * 2;

    doc.rect(contentOriginX(), y, contentWidth(), footerHeight).fill(navy);
    doc.fillColor(white).font("Helvetica").fontSize(9.5);
    doc.text(leftFooter, contentOriginX() + 10, y + footerPad, {
      width: footerColW - 20,
      align: "center",
    });
    doc.text(rightFooter, contentOriginX() + footerColW + 10, y + footerPad, {
      width: footerColW - 20,
      align: "center",
    });

    doc.end();
  });
}
