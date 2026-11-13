import "server-only";

import { prisma } from "@/lib/prisma";
import {
  ARTICLE_AUTHOR_DEFAULT,
  extractArticleFaqItems,
  isValidArticleSlug,
  slugifyArticleTitle,
  validateMetaDescription,
} from "@/lib/articles-shared";

export type ArticleAdminInput = {
  title: string;
  slug?: string | null;
  metaDescription: string;
  contentMarkdown: string;
  coverImageUrl?: string | null;
  authorName?: string | null;
  published?: boolean;
  publishedAt?: string | null;
};

function normalizeCoverImageUrl(value: string | null | undefined) {
  const trimmed = value?.trim() || "";
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

function parsePublishedAt(value: string | null | undefined, published: boolean) {
  if (!published) {
    return null;
  }
  if (value?.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

export async function listPublishedArticles() {
  return prisma.article.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      metaDescription: true,
      coverImageUrl: true,
      authorName: true,
      publishedAt: true,
      updatedAt: true,
    },
  });
}

export async function hasPublishedArticles() {
  try {
    const count = await prisma.article.count({ where: { published: true } });
    return count > 0;
  } catch (error) {
    console.error("hasPublishedArticles unavailable", error);
    return false;
  }
}

export async function getPublishedArticleBySlug(slug: string) {
  return prisma.article.findFirst({
    where: { slug, published: true },
  });
}

export async function listAdminArticles() {
  return prisma.article.findMany({
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      metaDescription: true,
      coverImageUrl: true,
      authorName: true,
      published: true,
      publishedAt: true,
      updatedAt: true,
      createdAt: true,
    },
  });
}

export async function getAdminArticleById(id: string) {
  return prisma.article.findUnique({ where: { id } });
}

export async function createAdminArticle(input: ArticleAdminInput) {
  const title = input.title.trim();
  if (!title) {
    return { ok: false as const, error: "Title is required." };
  }

  const metaError = validateMetaDescription(input.metaDescription);
  if (metaError) {
    return { ok: false as const, error: metaError };
  }

  const contentMarkdown = input.contentMarkdown.trim();
  if (!contentMarkdown) {
    return { ok: false as const, error: "Article content is required." };
  }

  const slug = (input.slug?.trim() || slugifyArticleTitle(title)).toLowerCase();
  if (!isValidArticleSlug(slug)) {
    return { ok: false as const, error: "Slug must be lowercase letters, numbers, and hyphens." };
  }

  const existing = await prisma.article.findUnique({ where: { slug }, select: { id: true } });
  if (existing) {
    return { ok: false as const, error: "That slug is already in use." };
  }

  const published = Boolean(input.published);
  const article = await prisma.article.create({
    data: {
      title,
      slug,
      metaDescription: input.metaDescription.trim(),
      contentMarkdown,
      coverImageUrl: normalizeCoverImageUrl(input.coverImageUrl),
      authorName: input.authorName?.trim() || ARTICLE_AUTHOR_DEFAULT,
      published,
      publishedAt: parsePublishedAt(input.publishedAt, published),
    },
  });

  return { ok: true as const, article };
}

export async function updateAdminArticle(id: string, input: ArticleAdminInput) {
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false as const, error: "Article not found." };
  }

  const title = input.title.trim();
  if (!title) {
    return { ok: false as const, error: "Title is required." };
  }

  const metaError = validateMetaDescription(input.metaDescription);
  if (metaError) {
    return { ok: false as const, error: metaError };
  }

  const contentMarkdown = input.contentMarkdown.trim();
  if (!contentMarkdown) {
    return { ok: false as const, error: "Article content is required." };
  }

  const slug = (input.slug?.trim() || slugifyArticleTitle(title)).toLowerCase();
  if (!isValidArticleSlug(slug)) {
    return { ok: false as const, error: "Slug must be lowercase letters, numbers, and hyphens." };
  }

  const slugConflict = await prisma.article.findFirst({
    where: { slug, id: { not: id } },
    select: { id: true },
  });
  if (slugConflict) {
    return { ok: false as const, error: "That slug is already in use." };
  }

  const published = Boolean(input.published);
  let publishedAt = existing.publishedAt;
  if (published) {
    publishedAt = parsePublishedAt(input.publishedAt, true) ?? existing.publishedAt ?? new Date();
  } else {
    publishedAt = null;
  }

  const article = await prisma.article.update({
    where: { id },
    data: {
      title,
      slug,
      metaDescription: input.metaDescription.trim(),
      contentMarkdown,
      coverImageUrl: normalizeCoverImageUrl(input.coverImageUrl),
      authorName: input.authorName?.trim() || ARTICLE_AUTHOR_DEFAULT,
      published,
      publishedAt,
    },
  });

  return { ok: true as const, article };
}

export async function unpublishAdminArticle(id: string) {
  const existing = await prisma.article.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return { ok: false as const, error: "Article not found." };
  }
  const article = await prisma.article.update({
    where: { id },
    data: { published: false, publishedAt: null },
  });
  return { ok: true as const, article };
}

export function articleFaqForSchema(contentMarkdown: string) {
  return extractArticleFaqItems(contentMarkdown);
}
