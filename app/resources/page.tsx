import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import ResourcesHub from "@/app/resources/ResourcesHub";
import { authOptions } from "@/lib/auth";
import {
  RESOURCES_PAGE_DESCRIPTION,
  RESOURCES_PAGE_TITLE,
} from "@/lib/resources-shared";
import { getPublicAppUrl } from "@/lib/public-app-url";

const siteUrl = getPublicAppUrl();
const ogImage = `${siteUrl}/apple-touch-icon.png`;

export const metadata: Metadata = {
  title: RESOURCES_PAGE_TITLE,
  description: RESOURCES_PAGE_DESCRIPTION,
  openGraph: {
    title: RESOURCES_PAGE_TITLE,
    description: RESOURCES_PAGE_DESCRIPTION,
    url: `${siteUrl}/resources`,
    siteName: "LCB Training",
    type: "website",
    images: [{ url: ogImage, width: 180, height: 180, alt: "LCB Training" }],
  },
  twitter: {
    card: "summary_large_image",
    title: RESOURCES_PAGE_TITLE,
    description: RESOURCES_PAGE_DESCRIPTION,
  },
};

export default async function ResourcesPage() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = Boolean(session?.user?.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:py-16">
      <header className="rounded-3xl border border-[#18243a] bg-[#0b1324]/90 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#52B788]">
          Free + paid resources
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
          Everything I Use to Build Better Players
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-300">
          Free tools and paid programs for players, parents, and coaches.
        </p>
        <p className="mt-4 text-sm text-zinc-400">
          12+ years of player development. NJCAA National Champion. Current high school varsity coach.
        </p>
      </header>

      <div className="mt-10">
        <ResourcesHub isLoggedIn={isLoggedIn} />
      </div>

      <footer className="mt-14 border-t border-[#18243a] pt-8 text-center text-sm text-zinc-400">
        <p>Instagram @lcbtraining | TikTok @cbroc05 | lcbtraining.com</p>
      </footer>
    </div>
  );
}
