import {
  absolutePublicUrl,
  getCanonicalSiteOrigin,
  ORGANIZATION_LEGAL_NAME,
} from "@/lib/public-seo";
import type { ArticleFaqItem } from "@/lib/articles-shared";

type ArticleJsonLdProps = {
  title: string;
  description: string;
  slug: string;
  authorName: string;
  datePublished: string;
  dateModified: string;
  coverImageUrl?: string | null;
  faqItems?: ArticleFaqItem[];
};

export default function ArticleJsonLd({
  title,
  description,
  slug,
  authorName,
  datePublished,
  dateModified,
  coverImageUrl,
  faqItems = [],
}: ArticleJsonLdProps) {
  const siteUrl = getCanonicalSiteOrigin();
  const url = absolutePublicUrl(`/articles/${slug}`);
  const image = coverImageUrl
    ? coverImageUrl.startsWith("http")
      ? coverImageUrl
      : absolutePublicUrl(coverImageUrl)
    : undefined;

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    author: {
      "@type": "Person",
      name: authorName,
    },
    datePublished,
    dateModified,
    mainEntityOfPage: url,
    publisher: {
      "@type": "Organization",
      name: ORGANIZATION_LEGAL_NAME,
      url: siteUrl,
    },
    ...(image ? { image: [image] } : {}),
  };

  const faq =
    faqItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }}
      />
      {faq ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
        />
      ) : null}
    </>
  );
}
