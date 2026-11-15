export const ARTICLE_LEAD_SOURCE_PREFIX = "Article:";

export const ARTICLE_LEAD_OFFER_COPY =
  "Want this plan as a printable one-pager? Enter your email and I'll send it, plus new drills and articles when I post them.";

export const ARTICLE_LEAD_SUCCESS_COPY = "Sent! Check your inbox.";

export function buildArticleLeadSource(slug: string) {
  return `${ARTICLE_LEAD_SOURCE_PREFIX} ${slug.trim()}`;
}

export function parseArticleLeadSource(source: string): string | null {
  const match = new RegExp(`^${ARTICLE_LEAD_SOURCE_PREFIX}\\s*(.+)$`, "i").exec(source.trim());
  if (!match?.[1]) {
    return null;
  }
  return match[1].trim() || null;
}

export function formatLeadSourceLabel(source: string) {
  if (source === "quiz") {
    return "Quiz";
  }
  const articleSlug = parseArticleLeadSource(source);
  if (articleSlug) {
    return `Article: ${articleSlug}`;
  }
  return source;
}

export function isArticleLeadSource(source: string | null | undefined) {
  return Boolean(source && parseArticleLeadSource(source));
}
