export const ARTICLE_AUTHOR_DEFAULT = "Coach Broc (Chris Broccolino)";
export const ARTICLES_INDEX_PATH = "/articles";
export const FREE_SWING_ARTICLE_CTA_HREF = "/free-swing-breakdown";
export const FREE_SWING_ARTICLE_CTA_TEXT =
  "Want a plan built for your player? Get a free swing breakdown from Coach Broc.";

export type ArticleFaqItem = {
  question: string;
  answer: string;
};

export type ArticleTocItem = {
  id: string;
  title: string;
};

export function slugifyArticleTitle(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isArticleTocSkippedHeading(title: string) {
  const normalized = title.trim().toLowerCase();
  return (
    /^key\s+takeaways?$/.test(normalized) ||
    /^faq$/.test(normalized) ||
    /^frequently\s+asked\s+questions?$/.test(normalized)
  );
}

function assignUniqueHeadingIds(titles: string[]): ArticleTocItem[] {
  const used = new Map<string, number>();
  return titles.map((title) => {
    const base = slugifyArticleTitle(title) || "section";
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    const id = count === 0 ? base : `${base}-${count + 1}`;
    return { id, title };
  });
}

/** All ## headings in document order, with unique anchor ids. */
export function extractArticleH2Headings(markdown: string): ArticleTocItem[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const titles: string[] = [];
  for (const rawLine of lines) {
    const match = /^##\s+(.+)$/.exec(rawLine.trim());
    if (!match) {
      continue;
    }
    const title = match[1].replace(/\s+#+\s*$/, "").trim();
    if (title) {
      titles.push(title);
    }
  }
  return assignUniqueHeadingIds(titles);
}

/** TOC entries: ## headings excluding Key takeaways and FAQ. */
export function extractArticleTocItems(markdown: string) {
  return extractArticleH2Headings(markdown).filter(
    (item) => !isArticleTocSkippedHeading(item.title),
  );
}

/**
 * Split markdown so Key takeaways (heading + body until the next ##) stay above the TOC.
 * If there is no Key takeaways section, `before` is empty and `after` is the full markdown.
 */
export function splitMarkdownAfterKeyTakeaways(markdown: string): {
  before: string;
  after: string;
} {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  let takeawaysStart = -1;
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^##\s+(.+)$/.exec(lines[index]!.trim());
    if (!match) {
      continue;
    }
    const title = match[1].replace(/\s+#+\s*$/, "").trim();
    if (/^key\s+takeaways?$/i.test(title)) {
      takeawaysStart = index;
      break;
    }
  }

  if (takeawaysStart < 0) {
    return { before: "", after: normalized };
  }

  let takeawaysEnd = lines.length;
  for (let index = takeawaysStart + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index]!.trim())) {
      takeawaysEnd = index;
      break;
    }
  }

  const before = lines.slice(0, takeawaysEnd).join("\n").replace(/\n+$/, "");
  const after = lines.slice(takeawaysEnd).join("\n").replace(/^\n+/, "");
  return { before, after };
}

function keyTakeawaysSectionBounds(markdown: string): {
  start: number;
  end: number;
  items: string[];
} | null {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let start = -1;
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^##\s+(.+)$/.exec(lines[index]!.trim());
    if (!match) {
      continue;
    }
    const title = match[1].replace(/\s+#+\s*$/, "").trim();
    if (/^key\s+takeaways?$/i.test(title)) {
      start = index;
      break;
    }
  }
  if (start < 0) {
    return null;
  }

  const items: string[] = [];
  let end = start + 1;
  let sawList = false;
  for (let index = start + 1; index < lines.length; index += 1) {
    const trimmed = lines[index]!.trim();
    if (/^##\s+/.test(trimmed)) {
      end = index;
      break;
    }
    const bullet = /^[-*]\s+(.+)$/.exec(trimmed);
    if (bullet?.[1]) {
      items.push(bullet[1].trim());
      sawList = true;
      end = index + 1;
      continue;
    }
    if (!trimmed) {
      if (sawList) {
        end = index + 1;
        break;
      }
      end = index + 1;
      continue;
    }
    // Non-bullet body after the list belongs to the article, not takeaways.
    end = index;
    break;
  }

  return { start, end, items };
}

/** Bullet items from a Key takeaways section; empty if none. */
export function extractKeyTakeawayItems(markdown: string): string[] {
  return keyTakeawaysSectionBounds(markdown)?.items ?? [];
}

/** Drop the Key takeaways ## heading + bullets; keep following intro copy. */
export function stripKeyTakeawaysSection(markdown: string): string {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const bounds = keyTakeawaysSectionBounds(normalized);
  if (!bounds) {
    return normalized;
  }
  const lines = normalized.split("\n");
  const kept = [...lines.slice(0, bounds.start), ...lines.slice(bounds.end)]
    .join("\n")
    .replace(/^\n+/, "")
    .replace(/\n+$/, "");
  return kept;
}

/** Split body markdown from an FAQ ## section. */
export function splitMarkdownAtFaq(markdown: string): {
  body: string;
  faqMarkdown: string;
} {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  let faqStart = -1;
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^##\s+(.+)$/.exec(lines[index]!.trim());
    if (!match) {
      continue;
    }
    const title = match[1].replace(/\s+#+\s*$/, "").trim();
    if (/^faq$/i.test(title) || /^frequently\s+asked\s+questions?$/i.test(title)) {
      faqStart = index;
      break;
    }
  }
  if (faqStart < 0) {
    return { body: normalized, faqMarkdown: "" };
  }
  const body = lines.slice(0, faqStart).join("\n").replace(/\n+$/, "");
  const faqMarkdown = lines.slice(faqStart).join("\n").replace(/^\n+/, "");
  return { body, faqMarkdown };
}

function isFaqHeadingLine(line: string) {
  return /^faq$/i.test(line) || /^frequently\s+asked\s+questions?$/i.test(line);
}

function isPreferSubheadingTitle(line: string) {
  return /^(what a |which one |why |the \d|questions to ask|hitting vs\.|what progress)/i.test(
    line.trim(),
  );
}

function looksLikeHeadingLine(line: string) {
  const text = line.trim();
  if (!text || text.length > 100) {
    return false;
  }
  if (/^#{1,6}\s/.test(text) || /^[-*]\s/.test(text) || /^\d+\.\s/.test(text)) {
    return false;
  }
  if (isFaqHeadingLine(text)) {
    return false;
  }
  // Multi-sentence body/checklist lines are not headings.
  if (/\.\s+[A-Z"]/.test(text)) {
    return false;
  }
  if (/\?$/.test(text)) {
    return true;
  }
  // "we'll do everything." or similar quoted sentence endings.
  if (/[.!]["']$/.test(text) || /[.!]$/.test(text)) {
    return false;
  }
  return text.length <= 70;
}

function looksLikeSubheadingLine(line: string) {
  const text = line.trim();
  if (!looksLikeHeadingLine(text)) {
    return false;
  }
  // Nested "?" lines are list prompts (FAQ mode handles real Q&A headings).
  if (/\?\s*$/.test(text)) {
    return false;
  }
  return true;
}

function formatListItemMarkdown(line: string) {
  const labeledColon = /^([^:]{2,48}):\s+(.+)$/.exec(line);
  if (labeledColon) {
    return `- **${labeledColon[1].trim()}:** ${labeledColon[2].trim()}`;
  }
  const labeledPeriod = /^([A-Z][^.!?]{1,48})\.\s+(.+)$/.exec(line);
  if (labeledPeriod && labeledPeriod[2]!.length > 8) {
    return `- **${labeledPeriod[1].trim()}.** ${labeledPeriod[2].trim()}`;
  }
  return `- ${line}`;
}

function isLabeledListItemLine(line: string) {
  const text = line.trim();
  if (!text || looksLikeHeadingLine(text)) {
    return false;
  }
  const colon = /^([^:]{2,40}):\s+(\S[\s\S]*)$/.exec(text);
  if (colon && colon[1]!.trim().split(/\s+/).length <= 6) {
    return true;
  }
  // Short noun-phrase labels only ("Coach experience. ..."), not full sentences.
  const period = /^([A-Z][^.!?]{1,32})\.\s+(\S[\s\S]*)$/.exec(text);
  if (
    period &&
    period[1]!.trim().split(/\s+/).length <= 4 &&
    period[2]!.length > 8 &&
    text.length <= 160
  ) {
    return true;
  }
  return false;
}

function looksLikeListItemLine(line: string) {
  const text = line.trim();
  if (isLabeledListItemLine(text)) {
    return true;
  }
  if (!text || looksLikeHeadingLine(text)) {
    return false;
  }
  if (text.length > 160) {
    return false;
  }
  // Checklist-style lines, including ones with an embedded question.
  if (/[.!]["']?$/.test(text)) {
    return true;
  }
  return /\?\s*$/.test(text) && /\.\s+/.test(text);
}

function shouldEmitAsList(lines: string[]) {
  if (lines.length === 0) {
    return false;
  }
  if (lines.some((line) => looksLikeHeadingLine(line))) {
    return false;
  }
  if (lines.length >= 2 && lines.every(isLabeledListItemLine)) {
    return true;
  }
  return lines.length >= 2 && lines.every(looksLikeListItemLine);
}

function flushParagraph(out: string[], lines: string[]) {
  if (lines.length === 0) {
    return;
  }
  out.push(lines.join(" "));
  out.push("");
}

function flushList(out: string[], lines: string[]) {
  if (lines.length === 0) {
    return;
  }
  for (const line of lines) {
    out.push(formatListItemMarkdown(line));
  }
  out.push("");
}

function emitContentLines(out: string[], lines: string[]) {
  if (lines.length === 0) {
    return;
  }

  let index = 0;
  while (index < lines.length) {
    if (looksLikeSubheadingLine(lines[index]!)) {
      out.push(`### ${lines[index]}`);
      out.push("");
      index += 1;
      const chunk: string[] = [];
      while (
        index < lines.length &&
        !looksLikeSubheadingLine(lines[index]!)
      ) {
        chunk.push(lines[index]!);
        index += 1;
      }
      if (
        chunk.length >= 2 &&
        chunk.every((line) => /\?\s*$/.test(line.trim()))
      ) {
        flushList(out, chunk);
      } else if (shouldEmitAsList(chunk)) {
        flushList(out, chunk);
      } else {
        flushParagraph(out, chunk);
      }
      continue;
    }

    const chunk: string[] = [];
    while (index < lines.length && !looksLikeSubheadingLine(lines[index]!)) {
      chunk.push(lines[index]!);
      index += 1;
    }
    if (
      chunk.length >= 2 &&
      chunk.every((line) => /\?\s*$/.test(line.trim()))
    ) {
      flushList(out, chunk);
    } else if (shouldEmitAsList(chunk)) {
      flushList(out, chunk);
    } else {
      flushParagraph(out, chunk);
    }
  }
}

function emitBlockLines(out: string[], lines: string[], options: { asFaq?: boolean } = {}) {
  if (lines.length === 0) {
    return;
  }

  if (options.asFaq) {
    let index = 0;
    while (index < lines.length) {
      const line = lines[index]!;
      if (looksLikeHeadingLine(line)) {
        out.push(`### ${line}`);
        out.push("");
        index += 1;
        const answer: string[] = [];
        while (index < lines.length && !looksLikeHeadingLine(lines[index]!)) {
          answer.push(lines[index]!);
          index += 1;
        }
        flushParagraph(out, answer);
        continue;
      }
      out.push(line);
      out.push("");
      index += 1;
    }
    return;
  }

  if (looksLikeHeadingLine(lines[0]!)) {
    const level = isPreferSubheadingTitle(lines[0]!) ? "###" : "##";
    out.push(`${level} ${lines[0]}`);
    out.push("");
    emitContentLines(out, lines.slice(1));
    return;
  }

  emitContentLines(out, lines);
}

/**
 * Promote plain-paragraph CMS content into Markdown headings/lists when authors
 * pasted structure without ATX markers. Leaves already-structured Markdown alone.
 */
export function normalizeArticleMarkdown(markdown: string): string {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return "";
  }
  if (/^#{1,6}\s+\S/m.test(normalized)) {
    return normalized;
  }

  const blocks = normalized.split(/\n{2,}/);
  const out: string[] = [];
  let inFaq = false;

  for (const block of blocks) {
    const rawLines = block
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (rawLines.length === 0) {
      continue;
    }

    const faqIndex = rawLines.findIndex((line) => isFaqHeadingLine(line));
    const beforeFaq = faqIndex >= 0 ? rawLines.slice(0, faqIndex) : rawLines;
    const afterFaq = faqIndex >= 0 ? rawLines.slice(faqIndex + 1) : [];

    if (!inFaq && beforeFaq.length > 0) {
      if (
        out.length === 0 &&
        /^key\s+takeaways?$/i.test(beforeFaq[0]!) &&
        beforeFaq.length > 1
      ) {
        out.push("## Key takeaways");
        out.push("");
        for (const item of beforeFaq.slice(1)) {
          out.push(`- ${item}`);
        }
        out.push("");
      } else {
        emitBlockLines(out, beforeFaq);
      }
    } else if (inFaq && beforeFaq.length > 0) {
      emitBlockLines(out, beforeFaq, { asFaq: true });
    }

    if (faqIndex >= 0) {
      inFaq = true;
      out.push("## FAQ");
      out.push("");
      if (afterFaq.length > 0) {
        emitBlockLines(out, afterFaq, { asFaq: true });
      }
    }
  }

  return `${out.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}

/** Normalize then return markdown ready for TOC / body / FAQ extraction. */
export function prepareArticleMarkdown(markdown: string) {
  const content = normalizeArticleMarkdown(markdown);
  const takeaways = extractKeyTakeawayItems(content);
  const withoutTakeaways = stripKeyTakeawaysSection(content);
  const { body, faqMarkdown } = splitMarkdownAtFaq(withoutTakeaways);
  const tocItems = extractArticleTocItems(content);
  const headingIds = extractArticleH2Headings(body);
  const faqItems = extractArticleFaqItems(content);
  return {
    content,
    takeaways,
    bodyMarkdown: body,
    faqMarkdown,
    tocItems,
    headingIds,
    faqItems,
  };
}

export function isValidArticleSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim());
}

export function validateMetaDescription(value: string) {
  const trimmed = value.trim();
  if (trimmed.length < 110 || trimmed.length > 160) {
    return "Meta description must be 110-160 characters.";
  }
  return null;
}

/**
 * Extract FAQ pairs from Markdown after an FAQ heading.
 * Expects ### Question headings with following paragraph answers.
 */
export function extractArticleFaqItems(markdown: string): ArticleFaqItem[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let inFaq = false;
  let currentQuestion: string | null = null;
  let answerParts: string[] = [];
  const items: ArticleFaqItem[] = [];

  const flush = () => {
    if (!currentQuestion) {
      return;
    }
    const answer = answerParts.join(" ").replace(/\s+/g, " ").trim();
    if (answer) {
      items.push({ question: currentQuestion, answer });
    }
    currentQuestion = null;
    answerParts = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      if (level <= 2 && /faq|frequently asked/i.test(text)) {
        flush();
        inFaq = true;
        continue;
      }
      if (inFaq && level === 2 && !/faq|frequently asked/i.test(text)) {
        flush();
        inFaq = false;
        continue;
      }
      if (inFaq && level === 3) {
        flush();
        currentQuestion = text;
        continue;
      }
    }

    if (!inFaq || !currentQuestion) {
      continue;
    }
    if (!line || line.startsWith("#") || line.startsWith("|") || line.startsWith("- ")) {
      if (line.startsWith("- ")) {
        answerParts.push(line.replace(/^-\s+/, ""));
      }
      continue;
    }
    answerParts.push(line);
  }

  flush();
  return items;
}

export function formatArticleDateLabel(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  });
}
