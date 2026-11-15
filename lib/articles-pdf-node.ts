/**
 * Branded printable article PDF (pdfkit). One to two pages: takeaways, section highlights, FAQ.
 */

import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import {
  extractArticleFaqItems,
  extractArticleTocItems,
  extractKeyTakeawayItems,
  normalizeArticleMarkdown,
  stripKeyTakeawaysSection,
  splitMarkdownAtFaq,
} from "@/lib/articles-shared";
import {
  PLAYER_EVAL_LOGO_RELATIVE_PATH,
  PLAYER_EVAL_PDF_COLORS,
  PLAYER_EVAL_PDF_LAYOUT,
} from "@/lib/player-evaluation-pdf-layout-shared";

export type ArticlePdfInput = {
  title: string;
  authorName: string;
  contentMarkdown: string;
  publicUrl?: string;
  projectRoot?: string;
};

type PdfDoc = InstanceType<typeof PDFDocument>;

type SectionBlock = {
  heading: string;
  body: string;
};

function resolveLogoPath(projectRoot: string) {
  const logoPath = path.join(projectRoot, PLAYER_EVAL_LOGO_RELATIVE_PATH);
  return fs.existsSync(logoPath) ? logoPath : null;
}

function contentX() {
  return PLAYER_EVAL_PDF_LAYOUT.marginLeft;
}

function contentW() {
  return PLAYER_EVAL_PDF_LAYOUT.contentWidth;
}

function stripInlineMarkdown(value: string) {
  return value
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[-*]\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSectionBlocks(bodyMarkdown: string): SectionBlock[] {
  const lines = bodyMarkdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: SectionBlock[] = [];
  let currentHeading = "";
  let bodyParts: string[] = [];

  const flush = () => {
    if (!currentHeading) {
      return;
    }
    const body = stripInlineMarkdown(bodyParts.join(" "));
    blocks.push({ heading: currentHeading, body });
    currentHeading = "";
    bodyParts = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const h2 = /^##\s+(.+)$/.exec(line);
    if (h2) {
      flush();
      currentHeading = h2[1]!.replace(/\s+#+\s*$/, "").trim();
      continue;
    }
    if (/^###\s+/.test(line) || !line) {
      continue;
    }
    if (currentHeading) {
      bodyParts.push(line);
    }
  }
  flush();
  return blocks;
}

function drawLogo(doc: PdfDoc, projectRoot: string, y: number) {
  const logoPath = resolveLogoPath(projectRoot);
  const centerX = contentX() + contentW() / 2;
  if (!logoPath) {
    const h = 28;
    const w = 140;
    doc
      .roundedRect(centerX - w / 2, y, w, h, 6)
      .fill(PLAYER_EVAL_PDF_COLORS.navy);
    doc
      .fillColor(PLAYER_EVAL_PDF_COLORS.white)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("LCB TRAINING", contentX(), y + 9, { width: contentW(), align: "center" });
    return y + h;
  }
  const maxW = PLAYER_EVAL_PDF_LAYOUT.logoMaxWidth;
  const maxH = PLAYER_EVAL_PDF_LAYOUT.logoMaxHeight;
  doc.image(logoPath, centerX - maxW / 2, y, { fit: [maxW, maxH], align: "center" });
  return y + maxH;
}

function ensureSpace(doc: PdfDoc, y: number, needed: number) {
  const bottom = PLAYER_EVAL_PDF_LAYOUT.pageHeight - PLAYER_EVAL_PDF_LAYOUT.marginBottom;
  if (y + needed <= bottom) {
    return y;
  }
  doc.addPage();
  return PLAYER_EVAL_PDF_LAYOUT.marginTop;
}

export function renderArticlePdfToBuffer(input: ArticlePdfInput): Promise<Buffer> {
  const projectRoot = input.projectRoot ?? process.cwd();
  const { navy, green } = PLAYER_EVAL_PDF_COLORS;
  const normalized = normalizeArticleMarkdown(input.contentMarkdown);
  const takeaways = extractKeyTakeawayItems(normalized);
  const withoutTakeaways = stripKeyTakeawaysSection(normalized);
  const { body } = splitMarkdownAtFaq(withoutTakeaways);
  const tocItems = extractArticleTocItems(normalized);
  const faqItems = extractArticleFaqItems(normalized).slice(0, 5);
  const sections = extractSectionBlocks(body).slice(0, 8);

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

    let y = PLAYER_EVAL_PDF_LAYOUT.marginTop;
    y = drawLogo(doc, projectRoot, y) + 10;

    doc.fillColor(navy).font("Helvetica-Bold").fontSize(18);
    doc.text(input.title, contentX(), y, { width: contentW(), align: "left" });
    y = doc.y + 6;

    doc.fillColor(green).font("Helvetica").fontSize(10);
    doc.text(`By ${input.authorName}  |  LCB Training`, contentX(), y, { width: contentW() });
    y = doc.y + 10;

    doc
      .moveTo(contentX(), y)
      .lineTo(contentX() + contentW(), y)
      .strokeColor(green)
      .lineWidth(1.2)
      .stroke();
    y += 14;

    if (takeaways.length > 0) {
      y = ensureSpace(doc, y, 40);
      doc.fillColor(navy).font("Helvetica-Bold").fontSize(12).text("Key takeaways", contentX(), y);
      y = doc.y + 6;
      doc.font("Helvetica").fontSize(10).fillColor(navy);
      for (const item of takeaways) {
        y = ensureSpace(doc, y, 28);
        doc.text(`-  ${stripInlineMarkdown(item)}`, contentX(), y, {
          width: contentW(),
          lineGap: 2,
        });
        y = doc.y + 4;
      }
      y += 6;
    }

    if (sections.length > 0) {
      y = ensureSpace(doc, y, 36);
      doc.fillColor(navy).font("Helvetica-Bold").fontSize(12).text("Highlights", contentX(), y);
      y = doc.y + 8;
      for (const section of sections) {
        const preview = section.body.slice(0, 280);
        y = ensureSpace(doc, y, 48);
        doc.fillColor(green).font("Helvetica-Bold").fontSize(11).text(section.heading, contentX(), y, {
          width: contentW(),
        });
        y = doc.y + 3;
        if (preview) {
          doc
            .fillColor(navy)
            .font("Helvetica")
            .fontSize(9.5)
            .text(preview + (section.body.length > 280 ? "..." : ""), contentX(), y, {
              width: contentW(),
              lineGap: 1.5,
            });
          y = doc.y + 8;
        }
      }
    } else if (tocItems.length > 0) {
      y = ensureSpace(doc, y, 36);
      doc.fillColor(navy).font("Helvetica-Bold").fontSize(12).text("In this article", contentX(), y);
      y = doc.y + 6;
      doc.font("Helvetica").fontSize(10).fillColor(navy);
      for (const item of tocItems.slice(0, 12)) {
        y = ensureSpace(doc, y, 18);
        doc.text(`-  ${item.title}`, contentX(), y, { width: contentW() });
        y = doc.y + 3;
      }
      y += 6;
    }

    if (faqItems.length > 0) {
      y = ensureSpace(doc, y, 40);
      doc.fillColor(navy).font("Helvetica-Bold").fontSize(12).text("FAQ", contentX(), y);
      y = doc.y + 8;
      for (const item of faqItems) {
        y = ensureSpace(doc, y, 56);
        doc.fillColor(green).font("Helvetica-Bold").fontSize(10).text(item.question, contentX(), y, {
          width: contentW(),
        });
        y = doc.y + 3;
        doc
          .fillColor(navy)
          .font("Helvetica")
          .fontSize(9.5)
          .text(item.answer.slice(0, 320) + (item.answer.length > 320 ? "..." : ""), contentX(), y, {
            width: contentW(),
            lineGap: 1.5,
          });
        y = doc.y + 8;
      }
    }

    y = ensureSpace(doc, y, 40);
    doc
      .roundedRect(contentX(), y, contentW(), 36, 6)
      .fillOpacity(0.08)
      .fill(green)
      .fillOpacity(1);
    doc
      .fillColor(navy)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(
        input.publicUrl
          ? `Read the full article: ${input.publicUrl}`
          : "More drills and plans at lcbtraining.com",
        contentX() + 10,
        y + 12,
        { width: contentW() - 20 },
      );

    doc.end();
  });
}
