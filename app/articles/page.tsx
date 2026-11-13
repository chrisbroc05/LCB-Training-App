import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Inter, Oswald } from "next/font/google";
import { listPublishedArticles } from "@/lib/articles-server";
import { formatArticleDateLabel } from "@/lib/articles-shared";
import { metadataForPublicPage } from "@/lib/public-seo";

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-article-display",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-article-body",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = metadataForPublicPage("articles");

export default async function ArticlesIndexPage() {
  let articles: Awaited<ReturnType<typeof listPublishedArticles>> = [];
  try {
    articles = await listPublishedArticles();
  } catch (error) {
    console.error("Articles index unavailable", error);
  }

  return (
    <div className={`${oswald.variable} ${inter.variable} mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14`}>
      <header className="rounded-3xl border border-[#18243a] bg-[#0b1324]/90 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#52B788]">From Coach Broc</p>
        <h1
          className="mt-3 font-[family-name:var(--font-article-display)] text-3xl font-semibold tracking-wide text-white sm:text-4xl"
        >
          Articles
        </h1>
        <p className="mt-3 max-w-2xl font-[family-name:var(--font-article-body)] text-base leading-relaxed text-zinc-300">
          Practical hitting, training, and mindset notes for the days between lessons.
        </p>
      </header>

      {articles.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-[#18243a] bg-[#0b1324] px-5 py-8 text-sm text-zinc-400">
          New articles are on the way. Check back soon.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {articles.map((article) => {
            const dateLabel = formatArticleDateLabel(article.publishedAt ?? article.updatedAt);
            return (
              <li key={article.id}>
                <Link
                  href={`/articles/${article.slug}`}
                  className="block overflow-hidden rounded-2xl border border-[#18243a] bg-[#0b1324] transition hover:border-[#22c55e]/40"
                >
                  {article.coverImageUrl ? (
                    <div className="relative aspect-[16/9] w-full bg-[#050b16]">
                      <Image
                        src={article.coverImageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 720px"
                      />
                    </div>
                  ) : null}
                  <div className="px-5 py-5">
                    <h2 className="font-[family-name:var(--font-article-display)] text-xl font-semibold tracking-wide text-zinc-100 sm:text-2xl">
                      {article.title}
                    </h2>
                    {dateLabel ? (
                      <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500">{dateLabel}</p>
                    ) : null}
                    <p className="mt-3 font-[family-name:var(--font-article-body)] text-sm leading-relaxed text-zinc-400">
                      {article.metaDescription}
                    </p>
                    <p className="mt-4 text-sm font-semibold text-[#52B788]">Read article</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
