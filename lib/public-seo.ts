import type { Metadata } from "next";
import { getPublicAppUrl } from "@/lib/public-app-url";

/** Canonical host for public SEO tags (always www). */
export const PUBLIC_CANONICAL_ORIGIN = "https://www.lcbtraining.com";

export const PUBLIC_OG_IMAGE_PATH = "/images/og-default.png";
export const PUBLIC_OG_IMAGE_WIDTH = 1200;
export const PUBLIC_OG_IMAGE_HEIGHT = 630;
export const PUBLIC_OG_IMAGE_ALT = "LCB Training - Work Hard. Be Memorable.";

export const ORGANIZATION_LEGAL_NAME = "LCB Training LLC";
export const ORGANIZATION_FOUNDER_NAME = "Chris Broccolino";
export const ORGANIZATION_LOGO_PATH = "/logo/lcb-training-logo.png";

export function getCanonicalSiteOrigin() {
  const configured = getPublicAppUrl();
  if (configured.includes("localhost") || configured.includes("127.0.0.1")) {
    return configured;
  }
  return PUBLIC_CANONICAL_ORIGIN;
}

export function absolutePublicUrl(path = "") {
  const origin = getCanonicalSiteOrigin();
  if (!path || path === "/") {
    return origin;
  }
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function publicOgImageUrl() {
  return absolutePublicUrl(PUBLIC_OG_IMAGE_PATH);
}

export type PublicPageSeoInput = {
  path: string;
  title: string;
  description: string;
  ogType?: "website" | "profile" | "article";
  imagePath?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageAlt?: string;
};

export function buildPublicPageMetadata(input: PublicPageSeoInput): Metadata {
  const canonical = absolutePublicUrl(input.path);
  const imageUrl = absolutePublicUrl(input.imagePath ?? PUBLIC_OG_IMAGE_PATH);
  const imageWidth = input.imageWidth ?? PUBLIC_OG_IMAGE_WIDTH;
  const imageHeight = input.imageHeight ?? PUBLIC_OG_IMAGE_HEIGHT;
  const imageAlt = input.imageAlt ?? PUBLIC_OG_IMAGE_ALT;

  return {
    title: { absolute: input.title },
    description: input.description,
    alternates: { canonical },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: "LCB Training",
      type: input.ogType ?? "website",
      images: [
        {
          url: imageUrl,
          width: imageWidth,
          height: imageHeight,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [imageUrl],
    },
  };
}

/** Public route copy used for titles, descriptions, and sitemap lastmod. */
export const PUBLIC_PAGE_SEO = {
  home: {
    path: "",
    title: "Work Hard. Be Memorable. | LCB Training",
    description:
      "Daily plans and personal swing feedback from Coach Broc for youth, high school, and college baseball and softball players.",
    lastmod: "2026-11-13",
  },
  program: {
    path: "/program",
    title: "12-Week Coaching Program | Coach Broc",
    description:
      "Get a daily plan, weekly video feedback, and direct messaging with Coach Broc for 12 weeks of structured player development.",
    lastmod: "2026-11-13",
  },
  playbook: {
    path: "/playbook",
    title: "The Next Level Playbook | LCB Training",
    description:
      "Mindset chapters, drills, and guides from Coach Broc so players train with purpose between lessons and practices.",
    lastmod: "2026-11-13",
  },
  remote: {
    path: "/remote",
    title: "Book Your Remote Training Session | LCB",
    description:
      "Book a live 60-minute remote baseball coaching session with Coach Broc for personalized swing and skill feedback.",
    lastmod: "2026-11-13",
  },
  resources: {
    path: "/resources",
    title: "Everything I Use to Build Better Players",
    description:
      "Free tools and paid programs from Coach Broc for players, parents, and coaches who want better work between lessons.",
    lastmod: "2026-11-13",
  },
  clinics: {
    path: "/clinics",
    title: "Clinics | Baseball and Softball Training",
    description:
      "Sign up for upcoming LCB Training clinics with Coach Broc. Register online with secure checkout and day selection.",
    lastmod: "2026-11-13",
  },
  freeSwingBreakdown: {
    path: "/free-swing-breakdown",
    title: "Get a Free Video Swing Breakdown from Coach Broc",
    description:
      "Send Coach Broc 2-3 side-view swings and get a personal video breakdown with drills. Free for baseball and softball players youth through college.",
    lastmod: "2026-11-13",
  },
  articles: {
    path: "/articles",
    title: "Articles | Coach Broc Hitting Tips",
    description:
      "Practical baseball and softball training articles from Coach Broc on hitting, mindset, and the work between lessons.",
    lastmod: "2026-11-13",
  },
  quiz: {
    path: "/quiz",
    title: "The Player IQ Quiz | Coach Broc",
    description:
      "15 questions on mindset, game situations, and training. Most players don't score as high as they think. See where you stand.",
    lastmod: "2026-11-13",
  },
  fixIt: {
    path: "/fix-it",
    title: "Fix the Two Problems I See Most | LCB",
    description:
      "3-week Fix-It hitting plans for a flying front shoulder or drifting hips, with Coach Broc drill videos included.",
    lastmod: "2026-11-13",
  },
  freeRotate: {
    path: "/free/rotate",
    title: "Rotational Power Sample | Free PDF",
    description:
      "Download a free rotational power sample from Coach Broc with exercises to create more power from the ground up.",
    lastmod: "2026-11-13",
  },
  freeMobility: {
    path: "/free/mobility",
    title: "Mobility Sample | Free PDF | LCB Training",
    description:
      "Download a free mobility sample from Coach Broc with moves for hips, upper back, and shoulders that improve training.",
    lastmod: "2026-11-13",
  },
  coach: {
    path: "/coach",
    title: "Coach Broc (Chris Broccolino) | LCB",
    description:
      "Meet Coach Broc (Chris Broccolino): NJCAA National Champion, high school varsity coach, and LCB Training founder.",
    lastmod: "2026-11-13",
  },
  terms: {
    path: "/terms",
    title: "Terms of Service | LCB Training",
    description:
      "Read the LCB Training Terms of Service for the website, app, coaching services, purchases, and account responsibilities.",
    lastmod: "2026-10-21",
  },
  privacy: {
    path: "/privacy",
    title: "Privacy Policy | LCB Training LLC",
    description:
      "Learn what information LCB Training collects, how it is used for coaching and the app, and the choices available to you.",
    lastmod: "2026-09-29",
  },
  waiver: {
    path: "/waiver",
    title: "Assumption of Risk and Release of Liability",
    description:
      "Review the LCB Training assumption of risk and release of liability waiver required for coaching services and training.",
    lastmod: "2026-11-04",
  },
  stayClosed: {
    path: "/fix-it/fixit-stay-closed",
    title: "Stay Closed Fix-It Plan | LCB Training",
    description:
      "3-week Stay Closed Fix-It plan to keep your front shoulder closed, with Coach Broc drill videos and a clear practice schedule.",
    lastmod: "2026-11-13",
  },
  hitTheBrakes: {
    path: "/fix-it/fixit-hit-the-brakes",
    title: "Hit the Brakes Fix-It Plan | LCB Training",
    description:
      "3-week Hit the Brakes Fix-It plan to stop drifting and stay stacked, with Coach Broc drill videos and daily hitting work.",
    lastmod: "2026-11-13",
  },
} as const;

export type PublicPageSeoKey = keyof typeof PUBLIC_PAGE_SEO;

export function metadataForPublicPage(key: PublicPageSeoKey): Metadata {
  const page = PUBLIC_PAGE_SEO[key];
  return buildPublicPageMetadata({
    path: page.path,
    title: page.title,
    description: page.description,
  });
}
