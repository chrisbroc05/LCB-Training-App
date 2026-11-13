import { listPublishedArticles } from "@/lib/articles-server";
import { PUBLIC_PAGE_SEO, absolutePublicUrl } from "@/lib/public-seo";

/** Hosted at https://www.lcbtraining.com/{INDEXNOW_KEY}.txt */
export const INDEXNOW_KEY = "425d5c371f9848eb187f2c7ca89af4a1";

export async function listIndexNowUrls() {
  const articles = await listPublishedArticles().catch(() => []);
  const staticPages = Object.entries(PUBLIC_PAGE_SEO)
    .filter(([key]) => key !== "articles" || articles.length > 0)
    .map(([, page]) => absolutePublicUrl(page.path));
  const articleUrls = articles.map((article) => absolutePublicUrl(`/articles/${article.slug}`));
  return [...staticPages, ...articleUrls];
}

export async function buildIndexNowPayload() {
  const host = "www.lcbtraining.com";
  return {
    host,
    key: INDEXNOW_KEY,
    keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`,
    urlList: await listIndexNowUrls(),
  };
}
