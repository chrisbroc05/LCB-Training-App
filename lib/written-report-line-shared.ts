/**
 * Normalize written report line text (client-safe).
 */

const LEADING_ASCII_MARKERS = /^[\s\-*]+/;
const UNICODE_BULLET = /^\u2022\s*/;

export function stripWrittenReportLinePrefix(line: string): string {
  let trimmed = line.trim();
  while (trimmed.length > 0) {
    const withoutAscii = trimmed.replace(LEADING_ASCII_MARKERS, "").trim();
    const next = withoutAscii.replace(UNICODE_BULLET, "").trim();
    if (next === trimmed) {
      break;
    }
    trimmed = next;
  }
  return trimmed;
}

export function normalizeWrittenReportLines(lines: string[]): string[] {
  return lines.map(stripWrittenReportLinePrefix).filter((line) => line.length > 0);
}

export function formatWrittenReportLineForDisplay(line: string): string {
  return stripWrittenReportLinePrefix(line);
}
