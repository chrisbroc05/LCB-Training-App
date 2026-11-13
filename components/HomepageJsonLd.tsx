import { HOMEPAGE_DESCRIPTION, HOMEPAGE_TITLE } from "@/lib/homepage-seo";
import { HOMEPAGE_FAQ_ITEMS } from "@/lib/homepage-faq-shared";
import { getCanonicalSiteOrigin } from "@/lib/public-seo";

export default function HomepageJsonLd() {
  const siteUrl = getCanonicalSiteOrigin();

  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "LCB Training player development",
    provider: {
      "@type": "Organization",
      name: "LCB Training LLC",
      url: siteUrl,
    },
    areaServed: "Chicagoland",
    description: HOMEPAGE_DESCRIPTION,
    serviceType:
      "Baseball and softball player development coaching for youth, high school, and college players",
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOMEPAGE_FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const webSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: HOMEPAGE_TITLE,
    url: siteUrl,
    description: HOMEPAGE_DESCRIPTION,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(service) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSite) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
    </>
  );
}
