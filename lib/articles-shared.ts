export const ARTICLE_AUTHOR_DEFAULT = "Coach Broc (Chris Broccolino)";
export const ARTICLES_INDEX_PATH = "/articles";
export const FREE_SWING_ARTICLE_CTA_HREF = "/free-swing-breakdown";
export const FREE_SWING_ARTICLE_CTA_TEXT =
  "Want a plan built for your player? Get a free swing breakdown from Coach Broc.";

export type ArticleFaqItem = {
  question: string;
  answer: string;
};

export function slugifyArticleTitle(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
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
