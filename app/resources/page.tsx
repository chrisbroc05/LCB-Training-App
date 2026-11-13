import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import ResourcesTabsShell from "@/app/resources/ResourcesTabsShell";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import { FREE_SWING_LANDING_PATH } from "@/lib/free-swing-flow";
import { buildMyResourcesViewModel } from "@/lib/my-resources-server";
import { loadResourcesHubMemberContext } from "@/lib/resources-hub-member-server";
import { parseResourcesTabParam } from "@/lib/my-resources-shared";
import { metadataForPublicPage } from "@/lib/public-seo";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = metadataForPublicPage("resources");

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readTabParam(params: Record<string, string | string[] | undefined>) {
  const raw = params.tab;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return parseResourcesTabParam(value ?? null);
}

export default async function ResourcesPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const isLoggedIn = Boolean(session?.user?.id);
  const params = await searchParams;
  const tabFromUrl = readTabParam(params);

  let myResources = null;
  let hubMemberContext = null;
  let initialTab = tabFromUrl;

  if (session?.user?.id) {
    hubMemberContext = await loadResourcesHubMemberContext(session.user.id);
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: userAccessSelect,
    });
    const access = user ? toAccessUserFields(user) : null;
    if (access) {
      myResources = await buildMyResourcesViewModel({
        access,
        userId: session.user.id,
        email: session.user.email ?? "",
        isAdmin: isAdminEmail(session.user.email),
      });
      if (!params.tab && myResources.hasAny) {
        initialTab = "mine";
      }
    }
  }

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
        <p className="mt-4 text-sm text-zinc-400">
          Not sure where to start?{" "}
          <Link
            href={FREE_SWING_LANDING_PATH}
            className="font-semibold text-[#52B788] hover:text-[#9df3bd]"
          >
            Get a free swing breakdown from Coach Broc
          </Link>
          .
        </p>
      </header>

      <div className="mt-10">
        <Suspense fallback={<p className="text-sm text-zinc-400">Loading resources...</p>}>
          <ResourcesTabsShell
            isLoggedIn={isLoggedIn}
            initialTab={initialTab}
            myResources={myResources}
            hubMemberContext={hubMemberContext}
          />
        </Suspense>
      </div>

      <footer className="mt-14 border-t border-[#18243a] pt-8 text-center text-sm text-zinc-400">
        <p>Instagram @lcbtraining | TikTok @cbroc05 | lcbtraining.com</p>
      </footer>
    </div>
  );
}
