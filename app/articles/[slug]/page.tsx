import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Inter, Oswald } from "next/font/google";
import ArticleJsonLd from "@/components/ArticleJsonLd";
import ArticleMarkdown from "@/components/ArticleMarkdown";
import {
  FREE_SWING_ARTICLE_CTA_HREF,
  FREE_SWING_ARTICLE_CTA_TEXT,
  formatArticleDateLabel,
} from "@/lib/articles-shared";
import { articleFaqForSchema, getPublishedArticleBySlug } from "@/lib/articles-server";
import { buildPublicPageMetadata } from "@/lib/public-seo";

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-article-display",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-article-body",
});

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) {
    return buildPublicPageMetadata({
      path: `/articles/${slug}`,
      title: "Article | LCB Training",
      description:
        "Practical baseball and softball training notes from Coach Broc at LCB Training for players and parents.",
    });
  }

  return buildPublicPageMetadata({
    path: `/articles/${article.slug}`,
    title: article.title.length >= 30 && article.title.length <= 60
      ? article.title
      : `${article.title} | LCB`.slice(0, 60),
    description: article.metaDescription,
    ogType: "article",
    imagePath: article.coverImageUrl?.startsWith("/") ? article.coverImageUrl : undefined,
    imageAlt: article.title,
  });
}

function CoverImage({ src, alt }: { src: string; alt: string }) {
  if (src.startsWith("http")) {
    return (
      // External admin-supplied covers keep intrinsic sizing without remotePatterns.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} width={1200} height={630} className="h-auto w-full object-cover" />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={1200}
      height={630}
      className="h-auto w-full object-cover"
      sizes="(max-width: 768px) 100vw, 720px"
      priority
    />
  );
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) {
    notFound();
  }

  const dateLabel = formatArticleDateLabel(article.publishedAt ?? article.updatedAt);
  const faqItems = articleFaqForSchema(article.contentMarkdown);
  const datePublished = (article.publishedAt ?? article.createdAt).toISOString();
  const dateModified = article.updatedAt.toISOString();

  return (
    <article
      className={`${oswald.variable} ${inter.variable} mx-auto w-full max-w-3xl px-4 py-10 font-[family-name:var(--font-article-body)] sm:px-6 sm:py-14`}
    >
      <ArticleJsonLd
        title={article.title}
        description={article.metaDescription}
        slug={article.slug}
        authorName={article.authorName}
        datePublished={datePublished}
        dateModified={dateModified}
        coverImageUrl={article.coverImageUrl}
        faqItems={faqItems}
      />

      <p className="text-sm text-zinc-500">
        <Link href="/articles" className="text-[#52B788] hover:text-[#9df3bd]">
          Articles
        </Link>
        <span className="mx-2">/</span>
        {article.title}
      </p>

      <header className="mt-4">
        <h1 className="font-[family-name:var(--font-article-display)] text-3xl font-semibold tracking-wide text-white sm:text-4xl md:text-5xl">
          {article.title}
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          By {article.authorName}
          {dateLabel ? ` | ${dateLabel}` : ""}
        </p>
      </header>

      {article.coverImageUrl ? (
        <div className="mt-8 overflow-hidden rounded-2xl border border-[#18243a]">
          <CoverImage src={article.coverImageUrl} alt={article.title} />
        </div>
      ) : null}

      <div className="mt-8">
        <ArticleMarkdown markdown={article.contentMarkdown} />
      </div>

      <aside className="mt-12 rounded-2xl border border-[#52B788]/35 bg-[#0b1324] px-5 py-6 sm:px-6">
        <p className="font-[family-name:var(--font-article-display)] text-xl font-semibold tracking-wide text-zinc-100 sm:text-2xl">
          {FREE_SWING_ARTICLE_CTA_TEXT}
        </p>
        <Link
          href={FREE_SWING_ARTICLE_CTA_HREF}
          className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#35db72] sm:w-auto"
        >
          Get a free swing breakdown
        </Link>
      </aside>
    </article>
  );
}
