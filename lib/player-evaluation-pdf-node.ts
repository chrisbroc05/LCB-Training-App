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
const LINK_GREEN = "#1B7A4A";

export type PlayerEvaluationLibraryDrillLink = {
  title: string;
  href: string;
};

export type PlayerEvaluationPdfInput = {
  firstName: string;
  lastName: string;
  teamLabel: string;
  evalDateLabel: string;
  strengths: string[];
  areasToImprove: string[];
  /** Typed drills from the report drills box. */
  recommendedDrills: string[];
  /** Drill library titles attached from the admin picker (legacy). */
  libraryDrillTitles?: string[];
  /** Preferred: titled drills with deep links into the app library. */
  libraryDrills?: PlayerEvaluationLibraryDrillLink[];
  noteFromCoach: string;
  cta: PlayerEvaluationCtaContent;
  projectRoot?: string;
};

type PdfDoc = InstanceType<typeof PDFDocument>;

type LayoutScale = {
  titleSize: number;
  taglineSize: number;
  metaSize: number;
  sectionTitleSize: number;
  bulletSize: number;
  noteSize: number;
  bulletLineGap: number;
  noteLineGap: number;
  sectionGap: number;
  afterRuleGap: number;
  headerHeight: number;
  bodyPad: number;
  afterLogoGap: number;
  afterTitleGap: number;
  afterTaglineGap: number;
  afterMetaGap: number;
};

/** Largest to smallest; body text never drops below ~9pt. */
const LAYOUT_SCALES: LayoutScale[] = [
  {
    titleSize: 20,
    taglineSize: 12,
    metaSize: 10,
    sectionTitleSize: 12,
    bulletSize: 9.5,
    noteSize: 10,
    bulletLineGap: 2,
    noteLineGap: 3,
    sectionGap: 5,
    afterRuleGap: 6,
    headerHeight: 30,
    bodyPad: PLAYER_EVAL_PDF_LAYOUT.sectionBodyPadding,
    afterLogoGap: 4,
    afterTitleGap: 23,
    afterTaglineGap: 20,
    afterMetaGap: 18,
  },
  {
    titleSize: 18,
    taglineSize: 11,
    metaSize: 9.5,
    sectionTitleSize: 11,
    bulletSize: 9.25,
    noteSize: 9.5,
    bulletLineGap: 1.5,
    noteLineGap: 2.5,
    sectionGap: 4,
    afterRuleGap: 5,
    headerHeight: 28,
    bodyPad: 8,
    afterLogoGap: 3,
    afterTitleGap: 20,
    afterTaglineGap: 17,
    afterMetaGap: 15,
  },
  {
    titleSize: 17,
    taglineSize: 10.5,
    metaSize: 9,
    sectionTitleSize: 10.5,
    bulletSize: 9,
    noteSize: 9,
    bulletLineGap: 1.25,
    noteLineGap: 2,
    sectionGap: 3,
    afterRuleGap: 4,
    headerHeight: 26,
    bodyPad: 7,
    afterLogoGap: 2,
    afterTitleGap: 18,
    afterTaglineGap: 15,
    afterMetaGap: 13,
  },
];

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

function pageContentBottom() {
  return PLAYER_EVAL_PDF_LAYOUT.pageHeight - PLAYER_EVAL_PDF_LAYOUT.marginBottom;
}

function pageContentTop() {
  return PLAYER_EVAL_PDF_LAYOUT.marginTop;
}

function availableContentHeight() {
  return pageContentBottom() - pageContentTop();
}

function resolveLibraryDrills(input: PlayerEvaluationPdfInput): PlayerEvaluationLibraryDrillLink[] {
  if (input.libraryDrills && input.libraryDrills.length > 0) {
    return input.libraryDrills.filter((drill) => drill.title.trim());
  }
  return (input.libraryDrillTitles ?? [])
    .filter((title) => title.trim())
    .map((title) => ({ title, href: "" }));
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
  const textWidth = boxWidth - CTA_BOX_PAD_X * 2;
  doc.font("Helvetica-Bold").fontSize(CTA_HEADING_SIZE);
  const headingH = doc.heightOfString(cta.heading, { width: textWidth, lineGap: 0 });
  const useColumns = shouldUseCtaColumns(cta.offers.length);
  const offersH = measureOfferBlock(doc, cta, textWidth, useColumns);
  const urlH = measureCtaUrlLineHeight(doc);
  return CTA_BOX_PAD_Y + headingH + 10 + offersH + 10 + urlH + CTA_BOX_PAD_Y;
}

function measureFooterHeight(doc: PdfDoc) {
  const footerPad = 8;
  const footerColW = PLAYER_EVAL_PDF_LAYOUT.columnWidth;
  const footerInnerPad = 10;
  const textW = footerColW - footerInnerPad * 2;
  const leftTitle = "COACH BROC | LCB TRAINING";
  const leftTagline = "Work Hard. Be Memorable.";
  const rightLine1 = "847-208-9661 | chrisbroc05@gmail.com";
  const rightLine2 = "lcbtraining.com | @lcbtraining";

  doc.font("Helvetica-Bold").fontSize(9);
  const leftTitleH = doc.heightOfString(leftTitle, { width: textW, align: "left" });
  doc.font("Helvetica-Oblique").fontSize(8.5);
  const leftTaglineH = doc.heightOfString(leftTagline, { width: textW, align: "left" });
  doc.font("Helvetica").fontSize(8.5);
  const rightLine1H = doc.heightOfString(rightLine1, { width: textW, align: "right" });
  const rightLine2H = doc.heightOfString(rightLine2, { width: textW, align: "right" });
  const leftFooterH = leftTitleH + 3 + leftTaglineH;
  const rightFooterH = rightLine1H + 3 + rightLine2H;
  return Math.max(leftFooterH, rightFooterH) + footerPad * 2;
}

function measureBottomBlockHeight(doc: PdfDoc, cta: PlayerEvaluationCtaContent) {
  return measureCtaBoxHeight(doc, cta, contentWidth()) + 5 + measureFooterHeight(doc);
}

/**
 * Draw CTA offers without allowing PDFKit to auto-paginate mid-column.
 * Clip each text run to the pre-measured column height.
 */
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
  const headingH = doc.heightOfString(cta.heading, { width: textWidth, lineGap: 0 });
  doc.text(cta.heading, innerX, cursorY, {
    width: textWidth,
    lineGap: 0,
    height: headingH + 1,
    ellipsis: true,
  });
  cursorY += headingH + 10;

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
      maxColHeight = Math.max(maxColHeight, titleH + CTA_TITLE_BODY_GAP + bodyH);
    }

    for (let index = 0; index < cta.offers.length; index += 1) {
      const offer = cta.offers[index]!;
      const colX = innerX + index * (colWidth + CTA_COLUMN_GUTTER);
      doc.font("Helvetica-Bold").fontSize(CTA_OFFER_TITLE_SIZE);
      const titleH = doc.heightOfString(offer.title, { width: colWidth, lineGap: 1 });
      doc.fillColor(accentGreen).text(offer.title, colX, cursorY, {
        width: colWidth,
        lineGap: 1,
        height: titleH + 1,
        ellipsis: true,
      });
      doc.font("Helvetica").fontSize(CTA_OFFER_BODY_SIZE);
      const bodyH = doc.heightOfString(offer.body, { width: colWidth, lineGap: 1.5 });
      doc.fillColor(white).text(offer.body, colX, cursorY + titleH + CTA_TITLE_BODY_GAP, {
        width: colWidth,
        lineGap: 1.5,
        height: bodyH + 1,
        ellipsis: true,
      });
    }
    cursorY += maxColHeight + 10;
  } else if (cta.offers.length === 1) {
    const offer = cta.offers[0]!;
    doc.font("Helvetica-Bold").fontSize(CTA_OFFER_TITLE_SIZE);
    const titleH = doc.heightOfString(offer.title, { width: textWidth, lineGap: 1 });
    doc.fillColor(accentGreen).text(offer.title, innerX, cursorY, {
      width: textWidth,
      lineGap: 1,
      height: titleH + 1,
      ellipsis: true,
    });
    doc.font("Helvetica").fontSize(CTA_OFFER_BODY_SIZE);
    const bodyH = doc.heightOfString(offer.body, { width: textWidth, lineGap: 1.5 });
    doc.fillColor(white).text(offer.body, innerX, cursorY + titleH + CTA_TITLE_BODY_GAP, {
      width: textWidth,
      lineGap: 1.5,
      height: bodyH + 1,
      ellipsis: true,
    });
    cursorY += titleH + CTA_TITLE_BODY_GAP + bodyH + 10;
  }

  const urlH = measureCtaUrlLineHeight(doc);
  doc.fillColor(white).font("Helvetica-Bold").fontSize(CTA_URL_SIZE);
  doc.text(cta.urlLabel, innerX, cursorY, {
    lineBreak: false,
    height: urlH + 1,
    ellipsis: true,
  });

  doc.restore();
  return boxHeight;
}

function drawFooter(doc: PdfDoc, y: number) {
  const { navy, green, white } = PLAYER_EVAL_PDF_COLORS;
  const footerPad = 8;
  const footerColW = PLAYER_EVAL_PDF_LAYOUT.columnWidth;
  const footerInnerPad = 10;
  const footerHeight = measureFooterHeight(doc);
  const leftTitle = "COACH BROC | LCB TRAINING";
  const leftTagline = "Work Hard. Be Memorable.";
  const rightLine1 = "847-208-9661 | chrisbroc05@gmail.com";
  const rightLine2 = "lcbtraining.com | @lcbtraining";

  doc.rect(contentOriginX(), y, contentWidth(), footerHeight).fill(navy);

  const leftX = contentOriginX() + footerInnerPad;
  const rightX = contentOriginX() + footerColW + footerInnerPad;
  const textY = y + footerPad;
  const textW = footerColW - footerInnerPad * 2;

  doc.font("Helvetica-Bold").fontSize(9);
  const leftTitleH = doc.heightOfString(leftTitle, { width: textW, align: "left" });
  doc.fillColor(white).text(leftTitle, leftX, textY, {
    width: textW,
    align: "left",
    height: leftTitleH + 1,
    ellipsis: true,
  });
  doc.font("Helvetica-Oblique").fontSize(8.5);
  const leftTaglineH = doc.heightOfString(leftTagline, { width: textW, align: "left" });
  doc.fillColor(green).text(leftTagline, leftX, textY + leftTitleH + 3, {
    width: textW,
    align: "left",
    height: leftTaglineH + 1,
    ellipsis: true,
  });

  doc.font("Helvetica").fontSize(8.5);
  const rightLine1H = doc.heightOfString(rightLine1, { width: textW, align: "right" });
  doc.fillColor(white).text(rightLine1, rightX, textY, {
    width: textW,
    align: "right",
    height: rightLine1H + 1,
    ellipsis: true,
  });
  const rightLine2H = doc.heightOfString(rightLine2, { width: textW, align: "right" });
  doc.text(rightLine2, rightX, textY + rightLine1H + 3, {
    width: textW,
    align: "right",
    height: rightLine2H + 1,
    ellipsis: true,
  });

  return footerHeight;
}

function drawBottomBlock(doc: PdfDoc, y: number, cta: PlayerEvaluationCtaContent) {
  const ctaHeight = drawCtaBox(doc, contentOriginX(), y, contentWidth(), cta);
  const footerHeight = drawFooter(doc, y + ctaHeight + 5);
  return ctaHeight + 5 + footerHeight;
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
  items: Array<string | PlayerEvaluationLibraryDrillLink>,
  x: number,
  y: number,
  cellWidth: number,
  fontSize: number,
  lineGap: number,
  color: string,
  asLinks: boolean,
) {
  const textWidth = bulletTextWidth(cellWidth);
  let cursorY = y;
  for (const item of items) {
    const title = typeof item === "string" ? item : item.title;
    const href = typeof item === "string" ? "" : item.href;
    const display = formatWrittenReportLineForDisplay(title);
    const bullet = `\u2022 ${display}`;
    doc.font("Helvetica").fontSize(fontSize);
    const h = doc.heightOfString(bullet, { width: textWidth, lineGap });
    if (asLinks && href) {
      doc.fillColor(LINK_GREEN).text(bullet, x + CTA_SECTION_BODY_TEXT_PAD, cursorY, {
        width: textWidth,
        lineGap,
        height: h + 1,
        ellipsis: true,
        link: href,
        underline: true,
      });
    } else {
      doc.fillColor(color).text(bullet, x + CTA_SECTION_BODY_TEXT_PAD, cursorY, {
        width: textWidth,
        lineGap,
        height: h + 1,
        ellipsis: true,
      });
    }
    cursorY += h + 2;
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
  const h = doc.heightOfString(text, { width: width - 20, lineGap });
  doc.text(text, x + 10, y, {
    width: width - 20,
    lineGap,
    height: h + 1,
    ellipsis: true,
  });
  return y + h + 4;
}

type SectionSpec = {
  title: string;
  kind: "bullets" | "note" | "links";
  bullets?: string[];
  links?: PlayerEvaluationLibraryDrillLink[];
  note?: string;
};

function measureSectionCell(doc: PdfDoc, width: number, spec: SectionSpec, scale: LayoutScale) {
  const innerWidth = width - PLAYER_EVAL_PDF_LAYOUT.sectionLeftBarWidth;
  let bodyContentHeight = 0;
  if ((spec.kind === "bullets" || spec.kind === "links") && (spec.bullets || spec.links)) {
    const items =
      spec.kind === "links"
        ? (spec.links ?? []).map((link) => link.title)
        : (spec.bullets ?? []);
    bodyContentHeight = measureBulletList(
      doc,
      items,
      width,
      scale.bulletSize,
      scale.bulletLineGap,
    );
  } else if (spec.kind === "note" && spec.note) {
    bodyContentHeight = measureNoteParagraph(
      doc,
      spec.note,
      width,
      scale.noteSize,
      scale.noteLineGap,
    );
  }
  const bodyHeight = bodyContentHeight + scale.bodyPad * 2;
  return scale.headerHeight + bodyHeight;
}

function drawSectionCell(
  doc: PdfDoc,
  x: number,
  y: number,
  width: number,
  spec: SectionSpec,
  scale: LayoutScale,
  bodyHeightOverride?: number,
) {
  const { navy, green, lightGreen, lightGray, white } = PLAYER_EVAL_PDF_COLORS;
  const headerHeight = scale.headerHeight;
  const innerX = x + PLAYER_EVAL_PDF_LAYOUT.sectionLeftBarWidth;
  const innerWidth = width - PLAYER_EVAL_PDF_LAYOUT.sectionLeftBarWidth;

  let bodyContentHeight = 0;
  if ((spec.kind === "bullets" || spec.kind === "links") && (spec.bullets || spec.links)) {
    const items =
      spec.kind === "links"
        ? (spec.links ?? []).map((link) => link.title)
        : (spec.bullets ?? []);
    bodyContentHeight = measureBulletList(
      doc,
      items,
      width,
      scale.bulletSize,
      scale.bulletLineGap,
    );
  } else if (spec.kind === "note" && spec.note) {
    bodyContentHeight = measureNoteParagraph(
      doc,
      spec.note,
      width,
      scale.noteSize,
      scale.noteLineGap,
    );
  }

  const bodyHeight = bodyHeightOverride ?? bodyContentHeight + scale.bodyPad * 2;
  const totalHeight = headerHeight + bodyHeight;

  doc.save();
  doc.lineWidth(PLAYER_EVAL_PDF_LAYOUT.sectionBorderWidth).strokeColor(lightGreen);
  doc.rect(x, y, width, totalHeight).stroke();
  doc.rect(x, y, PLAYER_EVAL_PDF_LAYOUT.sectionLeftBarWidth, totalHeight).fill(green);
  doc.rect(innerX, y, innerWidth, headerHeight).fill(navy);
  doc
    .fillColor(white)
    .font("Helvetica-Bold")
    .fontSize(scale.sectionTitleSize)
    .text(spec.title, innerX + 10, y + Math.max(6, (headerHeight - scale.sectionTitleSize) / 2 - 1), {
      width: innerWidth - 20,
      height: headerHeight - 4,
      ellipsis: true,
    });

  doc.rect(x, y + headerHeight, width, bodyHeight).fill(lightGray);

  const bodyY = y + headerHeight + scale.bodyPad;
  if (spec.kind === "bullets" && spec.bullets) {
    drawBulletList(
      doc,
      spec.bullets,
      x,
      bodyY,
      width,
      scale.bulletSize,
      scale.bulletLineGap,
      navy,
      false,
    );
  } else if (spec.kind === "links" && spec.links) {
    drawBulletList(
      doc,
      spec.links,
      x,
      bodyY,
      width,
      scale.bulletSize,
      scale.bulletLineGap,
      navy,
      true,
    );
  } else if (spec.kind === "note" && spec.note) {
    drawNoteParagraph(
      doc,
      spec.note,
      x,
      bodyY,
      width,
      scale.noteSize,
      scale.noteLineGap,
      navy,
    );
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

function measureLogoHeight(projectRoot: string) {
  const logoPath = resolveLogoPath(projectRoot);
  if (!logoPath) {
    return 36;
  }
  return PLAYER_EVAL_PDF_LAYOUT.logoMaxHeight;
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
      .text("LCB TRAINING", x, y + 10, { width: w, align: "center", height: 18, ellipsis: true });
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

function measureHeaderBlock(doc: PdfDoc, scale: LayoutScale, projectRoot: string) {
  let height = measureLogoHeight(projectRoot) + scale.afterLogoGap;
  height += scale.afterTitleGap;
  height += scale.afterTaglineGap;
  height += scale.afterMetaGap;
  height += PLAYER_EVAL_PDF_LAYOUT.hrThickness + scale.afterRuleGap;
  return height;
}

function measureBodySections(
  doc: PdfDoc,
  input: PlayerEvaluationPdfInput,
  libraryDrills: PlayerEvaluationLibraryDrillLink[],
  scale: LayoutScale,
) {
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
  const leftH = measureSectionCell(doc, colW, leftSpec, scale);
  const rightH = measureSectionCell(doc, colW, rightSpec, scale);
  let height = Math.max(leftH, rightH) + scale.sectionGap;

  const typedDrills = input.recommendedDrills.filter((line) => line.trim());
  if (typedDrills.length > 0) {
    height +=
      measureSectionCell(
        doc,
        contentWidth(),
        { title: "Recommended Drills", kind: "bullets", bullets: typedDrills },
        scale,
      ) + scale.sectionGap;
  }

  if (libraryDrills.length > 0) {
    height +=
      measureSectionCell(
        doc,
        contentWidth(),
        { title: "Drill videos in your app:", kind: "links", links: libraryDrills },
        scale,
      ) + scale.sectionGap;
  }

  height += measureSectionCell(
    doc,
    contentWidth(),
    { title: "Note from Coach Broc", kind: "note", note: input.noteFromCoach },
    scale,
  );

  return height;
}

function drawHeader(
  doc: PdfDoc,
  input: PlayerEvaluationPdfInput,
  scale: LayoutScale,
  projectRoot: string,
  startY: number,
) {
  const { navy, green } = PLAYER_EVAL_PDF_COLORS;
  let y = startY;
  y = drawLogo(doc, projectRoot, y);
  y += scale.afterLogoGap;

  doc
    .fillColor(navy)
    .font("Helvetica-Bold")
    .fontSize(scale.titleSize)
    .text("Player Evaluation Report", contentOriginX(), y, {
      width: contentWidth(),
      align: "center",
      height: scale.titleSize + 4,
      ellipsis: true,
    });
  y += scale.afterTitleGap;

  doc
    .fillColor(green)
    .font("Helvetica-BoldOblique")
    .fontSize(scale.taglineSize)
    .text('"Work Hard. Be Memorable."', contentOriginX(), y, {
      width: contentWidth(),
      align: "center",
      height: scale.taglineSize + 4,
      ellipsis: true,
    });
  y += scale.afterTaglineGap;

  const fullName = [input.firstName, input.lastName].filter(Boolean).join(" ");
  doc.font("Helvetica-Bold").fontSize(scale.metaSize);
  const metaBoldWidth = doc.widthOfString(fullName);
  doc.font("Helvetica").fontSize(scale.metaSize);
  const metaRest = `  |  ${input.teamLabel}  |  ${input.evalDateLabel}`;
  const metaTotalWidth = metaBoldWidth + doc.widthOfString(metaRest);
  const metaX = contentOriginX() + (contentWidth() - metaTotalWidth) / 2;
  doc
    .font("Helvetica-Bold")
    .fontSize(scale.metaSize)
    .fillColor(navy)
    .text(fullName, metaX, y, { continued: true, lineBreak: false });
  doc.font("Helvetica").text(metaRest, { continued: false, lineBreak: false });
  y += scale.afterMetaGap;

  drawHorizontalRule(doc, y);
  y += scale.afterRuleGap;
  return y;
}

function drawBodySections(
  doc: PdfDoc,
  input: PlayerEvaluationPdfInput,
  libraryDrills: PlayerEvaluationLibraryDrillLink[],
  scale: LayoutScale,
  startY: number,
) {
  const colW = PLAYER_EVAL_PDF_LAYOUT.columnWidth;
  let y = startY;

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
  const leftH = measureSectionCell(doc, colW, leftSpec, scale);
  const rightH = measureSectionCell(doc, colW, rightSpec, scale);
  const rowH = Math.max(leftH, rightH);
  drawSectionCell(doc, contentOriginX(), y, colW, leftSpec, scale, rowH - scale.headerHeight);
  drawSectionCell(
    doc,
    contentOriginX() + colW,
    y,
    colW,
    rightSpec,
    scale,
    rowH - scale.headerHeight,
  );
  y += rowH + scale.sectionGap;

  const typedDrills = input.recommendedDrills.filter((line) => line.trim());
  if (typedDrills.length > 0) {
    const drillsSpec: SectionSpec = {
      title: "Recommended Drills",
      kind: "bullets",
      bullets: typedDrills,
    };
    const drillsH = measureSectionCell(doc, contentWidth(), drillsSpec, scale);
    drawSectionCell(doc, contentOriginX(), y, contentWidth(), drillsSpec, scale);
    y += drillsH + scale.sectionGap;
  }

  if (libraryDrills.length > 0) {
    const librarySpec: SectionSpec = {
      title: "Drill videos in your app:",
      kind: "links",
      links: libraryDrills,
    };
    const libraryH = measureSectionCell(doc, contentWidth(), librarySpec, scale);
    drawSectionCell(doc, contentOriginX(), y, contentWidth(), librarySpec, scale);
    y += libraryH + scale.sectionGap;
  }

  const noteSpec: SectionSpec = {
    title: "Note from Coach Broc",
    kind: "note",
    note: input.noteFromCoach,
  };
  const noteH = measureSectionCell(doc, contentWidth(), noteSpec, scale);
  drawSectionCell(doc, contentOriginX(), y, contentWidth(), noteSpec, scale);
  y += noteH;
  return y;
}

export function renderPlayerEvaluationPdfToBuffer(input: PlayerEvaluationPdfInput): Promise<Buffer> {
  const projectRoot = input.projectRoot ?? process.cwd();
  const libraryDrills = resolveLibraryDrills(input);

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
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const bottomBlockHeight = measureBottomBlockHeight(doc, input.cta);
    const available = availableContentHeight();

    let chosenScale = LAYOUT_SCALES[LAYOUT_SCALES.length - 1]!;
    let fitsOnePage = false;

    for (const scale of LAYOUT_SCALES) {
      const headerH = measureHeaderBlock(doc, scale, projectRoot);
      const bodyH = measureBodySections(doc, input, libraryDrills, scale);
      const total = headerH + bodyH + scale.sectionGap + bottomBlockHeight;
      if (total <= available) {
        chosenScale = scale;
        fitsOnePage = true;
        break;
      }
    }

    if (fitsOnePage) {
      let y = pageContentTop();
      y = drawHeader(doc, input, chosenScale, projectRoot, y);
      y = drawBodySections(doc, input, libraryDrills, chosenScale, y);
      y += chosenScale.sectionGap;
      drawBottomBlock(doc, y, input.cta);
    } else {
      // Body on page 1 at the tightest readable scale; Keep building + footer move together to page 2.
      let y = pageContentTop();
      y = drawHeader(doc, input, chosenScale, projectRoot, y);
      drawBodySections(doc, input, libraryDrills, chosenScale, y);

      doc.addPage();
      drawBottomBlock(doc, pageContentTop(), input.cta);
    }

    doc.end();
  });
}
