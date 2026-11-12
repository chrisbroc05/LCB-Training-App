import type { Metadata } from "next";
import { getPublicAppUrl } from "@/lib/public-app-url";

export const HOMEPAGE_TITLE = "LCB Training | Baseball Coaching with Coach Broc";

export const HOMEPAGE_DESCRIPTION =
  "Daily baseball training and swing feedback from Coach Broc.";

export function buildHomepageMetadata(): Metadata {
  const siteUrl = getPublicAppUrl();
  const ogImage = `${siteUrl}/images/app-preview/daily-plan.webp`;

  return {
    title: {
      absolute: HOMEPAGE_TITLE,
    },
    description: HOMEPAGE_DESCRIPTION,
    alternates: { canonical: siteUrl },
    openGraph: {
      title: HOMEPAGE_TITLE,
      description: HOMEPAGE_DESCRIPTION,
      url: siteUrl,
      siteName: "LCB Training",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 750,
          height: 1624,
          alt: "LCB Training app daily plan screen on a phone",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: HOMEPAGE_TITLE,
      description: HOMEPAGE_DESCRIPTION,
      images: [ogImage],
    },
  };
}
