import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import FixItSalesPageClient from "@/app/fix-it/FixItSalesPageClient";
import { authOptions } from "@/lib/auth";
import { FIX_IT_PLANS_META } from "@/lib/fix-it-plans-shared";
import { getPublicAppUrl } from "@/lib/public-app-url";

const siteUrl = getPublicAppUrl();
const title = "Fix-It Hitting Plans | Coach Broc";
const description =
  "Two 3-week hitting Fix-It plans with Coach Broc drill videos. Fix a flying front shoulder or drifting hips off a tee or flips.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: `${siteUrl}/fix-it`,
    siteName: "LCB Training",
    type: "website",
    images: [{ url: `${siteUrl}/apple-touch-icon.png`, width: 180, height: 180, alt: "LCB Training" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default async function FixItSalesPage() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = Boolean(session?.user?.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:py-16">
      <header className="rounded-3xl border border-[#18243a] bg-[#0b1324]/90 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#52B788]">
          {FIX_IT_PLANS_META.salesLabel}
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
          {FIX_IT_PLANS_META.salesTitle}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-300">
          {FIX_IT_PLANS_META.salesSubtitle}
        </p>
      </header>

      <div className="mt-10">
        <FixItSalesPageClient isLoggedIn={isLoggedIn} />
      </div>
    </div>
  );
}
