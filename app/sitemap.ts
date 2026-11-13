import type { MetadataRoute } from "next";
import { listPublishedArticles } from "@/lib/articles-server";
import { PUBLIC_PAGE_SEO, absolutePublicUrl } from "@/lib/public-seo";

type SitemapEntry = {
  path: string;
  priority: number;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  lastModified: Date;
};

/** Priority order: home, then program / free swing / resources / playbook near the top. */
const PUBLIC_ENTRIES: Array<{
  path: string;
  priority: number;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  lastmod: string;
}> = [
  { path: PUBLIC_PAGE_SEO.home.path, priority: 1, changeFrequency: "weekly", lastmod: PUBLIC_PAGE_SEO.home.lastmod },
  {
    path: PUBLIC_PAGE_SEO.program.path,
    priority: 0.95,
    changeFrequency: "weekly",
    lastmod: PUBLIC_PAGE_SEO.program.lastmod,
  },
  {
    path: PUBLIC_PAGE_SEO.freeSwingBreakdown.path,
    priority: 0.92,
    changeFrequency: "weekly",
    lastmod: PUBLIC_PAGE_SEO.freeSwingBreakdown.lastmod,
  },
  {
    path: PUBLIC_PAGE_SEO.resources.path,
    priority: 0.9,
    changeFrequency: "weekly",
    lastmod: PUBLIC_PAGE_SEO.resources.lastmod,
  },
  {
    path: PUBLIC_PAGE_SEO.playbook.path,
    priority: 0.9,
    changeFrequency: "weekly",
    lastmod: PUBLIC_PAGE_SEO.playbook.lastmod,
  },
  {
    path: PUBLIC_PAGE_SEO.clinics.path,
    priority: 0.85,
    changeFrequency: "weekly",
    lastmod: PUBLIC_PAGE_SEO.clinics.lastmod,
  },
  {
    path: PUBLIC_PAGE_SEO.coach.path,
    priority: 0.8,
    changeFrequency: "monthly",
    lastmod: PUBLIC_PAGE_SEO.coach.lastmod,
  },
  {
    path: PUBLIC_PAGE_SEO.remote.path,
    priority: 0.8,
    changeFrequency: "monthly",
    lastmod: PUBLIC_PAGE_SEO.remote.lastmod,
  },
  {
    path: PUBLIC_PAGE_SEO.fixIt.path,
    priority: 0.75,
    changeFrequency: "monthly",
    lastmod: PUBLIC_PAGE_SEO.fixIt.lastmod,
  },
  {
    path: PUBLIC_PAGE_SEO.stayClosed.path,
    priority: 0.7,
    changeFrequency: "monthly",
    lastmod: PUBLIC_PAGE_SEO.stayClosed.lastmod,
  },
  {
    path: PUBLIC_PAGE_SEO.hitTheBrakes.path,
    priority: 0.7,
    changeFrequency: "monthly",
    lastmod: PUBLIC_PAGE_SEO.hitTheBrakes.lastmod,
  },
  {
    path: PUBLIC_PAGE_SEO.freeRotate.path,
    priority: 0.7,
    changeFrequency: "monthly",
    lastmod: PUBLIC_PAGE_SEO.freeRotate.lastmod,
  },
  {
    path: PUBLIC_PAGE_SEO.freeMobility.path,
    priority: 0.7,
    changeFrequency: "monthly",
    lastmod: PUBLIC_PAGE_SEO.freeMobility.lastmod,
  },
  {
    path: PUBLIC_PAGE_SEO.quiz.path,
    priority: 0.6,
    changeFrequency: "monthly",
    lastmod: PUBLIC_PAGE_SEO.quiz.lastmod,
  },
  { path: "/llms.txt", priority: 0.4, changeFrequency: "monthly", lastmod: "2026-11-13" },
  {
    path: PUBLIC_PAGE_SEO.terms.path,
    priority: 0.3,
    changeFrequency: "yearly",
    lastmod: PUBLIC_PAGE_SEO.terms.lastmod,
  },
  {
    path: PUBLIC_PAGE_SEO.privacy.path,
    priority: 0.3,
    changeFrequency: "yearly",
    lastmod: PUBLIC_PAGE_SEO.privacy.lastmod,
  },
  {
    path: PUBLIC_PAGE_SEO.waiver.path,
    priority: 0.3,
    changeFrequency: "yearly",
    lastmod: PUBLIC_PAGE_SEO.waiver.lastmod,
  },
];

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: SitemapEntry[] = PUBLIC_ENTRIES.map((entry) => ({
    path: entry.path,
    priority: entry.priority,
    changeFrequency: entry.changeFrequency,
    lastModified: new Date(`${entry.lastmod}T12:00:00.000Z`),
  }));

  let articleEntries: SitemapEntry[] = [];
  try {
    const articles = await listPublishedArticles();
    if (articles.length > 0) {
      articleEntries = [
        {
          path: PUBLIC_PAGE_SEO.articles.path,
          priority: 0.88,
          changeFrequency: "weekly",
          lastModified: new Date(`${PUBLIC_PAGE_SEO.articles.lastmod}T12:00:00.000Z`),
        },
        ...articles.map((article) => ({
          path: `/articles/${article.slug}`,
          priority: 0.7,
          changeFrequency: "monthly" as const,
          lastModified: article.updatedAt,
        })),
      ];
    }
  } catch (error) {
    console.error("Sitemap: published articles unavailable", error);
  }

  return [...staticEntries, ...articleEntries].map((entry) => ({
    url: absolutePublicUrl(entry.path),
    lastModified: entry.lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
