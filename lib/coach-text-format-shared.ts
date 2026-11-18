/**
 * Parse coach-written plain text into safe display blocks (client-safe).
 * Supports blank-line paragraphs, soft line breaks, -/* bullets, 1. lists, and **bold**.
 * Does not accept HTML.
 */

export type CoachTextInline =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "link"; href: string; value: string };

export type CoachTextBlock =
  | { type: "paragraph"; lines: CoachTextInline[][] }
  | { type: "ul"; items: CoachTextInline[][] }
  | { type: "ol"; items: CoachTextInline[][] };

export const COACH_TEXT_FORMATTING_TIP =
  "Formatting tips: blank line = new paragraph, - for bullets, **bold**";

const BULLET_LINE = /^[-*]\s+(.*)$/;
const NUMBERED_LINE = /^\d+\.\s+(.*)$/;
const BOLD_SPLIT = /(\*\*[^*]+\*\*)/g;
const BOLD_INNER = /^\*\*([^*]+)\*\*$/;
const URL_FIND = /https?:\/\/[^\s<]+[^\s<.,;:!?"')\]]/g;

function isSafeHttpUrl(href: string) {
  try {
    const parsed = new URL(href);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function parseTextWithLinks(text: string): CoachTextInline[] {
  const inlines: CoachTextInline[] = [];
  const finder = new RegExp(URL_FIND.source, "g");
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = finder.exec(text)) !== null) {
    if (match.index > lastIndex) {
      inlines.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    const href = match[0];
    if (isSafeHttpUrl(href)) {
      inlines.push({ type: "link", href, value: href });
    } else {
      inlines.push({ type: "text", value: href });
    }
    lastIndex = match.index + href.length;
  }
  if (lastIndex < text.length) {
    inlines.push({ type: "text", value: text.slice(lastIndex) });
  }
  return inlines.length > 0 ? inlines : [];
}

export function parseCoachTextInlines(line: string): CoachTextInline[] {
  if (!line) {
    return [];
  }
  const parts = line.split(BOLD_SPLIT);
  const inlines: CoachTextInline[] = [];
  for (const part of parts) {
    if (!part) continue;
    const boldMatch = part.match(BOLD_INNER);
    if (boldMatch) {
      inlines.push({ type: "bold", value: boldMatch[1] });
    } else {
      inlines.push(...parseTextWithLinks(part));
    }
  }
  return inlines;
}

export function parseCoachText(input: string): CoachTextBlock[] {
  const normalized = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!normalized.trim()) {
    return [];
  }

  const lines = normalized.split("\n");
  const blocks: CoachTextBlock[] = [];
  let paragraphLines: CoachTextInline[][] = [];
  let listKind: "ul" | "ol" | null = null;
  let listItems: CoachTextInline[][] = [];

  function flushParagraph() {
    if (paragraphLines.length === 0) return;
    blocks.push({ type: "paragraph", lines: paragraphLines });
    paragraphLines = [];
  }

  function flushList() {
    if (!listKind || listItems.length === 0) {
      listKind = null;
      listItems = [];
      return;
    }
    blocks.push({ type: listKind, items: listItems });
    listKind = null;
    listItems = [];
  }

  for (const rawLine of lines) {
    const trimmedRight = rawLine.replace(/\s+$/, "");
    if (trimmedRight.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }

    const bulletMatch = trimmedRight.match(BULLET_LINE);
    if (bulletMatch) {
      flushParagraph();
      if (listKind && listKind !== "ul") {
        flushList();
      }
      listKind = "ul";
      listItems.push(parseCoachTextInlines(bulletMatch[1]));
      continue;
    }

    const numberedMatch = trimmedRight.match(NUMBERED_LINE);
    if (numberedMatch) {
      flushParagraph();
      if (listKind && listKind !== "ol") {
        flushList();
      }
      listKind = "ol";
      listItems.push(parseCoachTextInlines(numberedMatch[1]));
      continue;
    }

    flushList();
    paragraphLines.push(parseCoachTextInlines(trimmedRight));
  }

  flushParagraph();
  flushList();
  return blocks;
}
