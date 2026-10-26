"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import MyResourcesPanel from "@/app/resources/MyResourcesPanel";
import ResourcesHub from "@/app/resources/ResourcesHub";
import type { MyResourcesTab, MyResourcesViewModel } from "@/lib/my-resources-shared";

type ResourcesTabsShellProps = {
  isLoggedIn: boolean;
  initialTab: MyResourcesTab;
  myResources: MyResourcesViewModel | null;
};

export default function ResourcesTabsShell({
  isLoggedIn,
  initialTab,
  myResources,
}: ResourcesTabsShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: MyResourcesTab =
    isLoggedIn && tabParam === "mine"
      ? "mine"
      : isLoggedIn && tabParam === "browse"
        ? "browse"
        : initialTab;

  const setTab = useCallback(
    (tab: MyResourcesTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`/resources?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }
    if (searchParams.get("tab")) {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", initialTab);
    router.replace(`/resources?${params.toString()}`, { scroll: false });
  }, [isLoggedIn, initialTab, router, searchParams]);

  return (
    <div>
      {isLoggedIn ? (
        <div className="mb-8 flex flex-wrap gap-2 border-b border-[#18243a] pb-4">
          <button
            type="button"
            onClick={() => setTab("browse")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === "browse"
                ? "bg-[#52B788] text-black"
                : "border border-[#2b3650] text-zinc-300 hover:border-[#52B788]"
            }`}
          >
            Browse
          </button>
          <button
            type="button"
            onClick={() => setTab("mine")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === "mine"
                ? "bg-[#52B788] text-black"
                : "border border-[#2b3650] text-zinc-300 hover:border-[#52B788]"
            }`}
          >
            My Resources
          </button>
        </div>
      ) : null}

      {activeTab === "mine" && isLoggedIn && myResources ? (
        <MyResourcesPanel model={myResources} />
      ) : (
        <ResourcesHub isLoggedIn={isLoggedIn} />
      )}

      {isLoggedIn && activeTab === "mine" ? (
        <p className="mt-8 text-center text-sm text-zinc-500">
          Need something else?{" "}
          <Link href="/resources?tab=browse" className="text-[#52B788] underline">
            Browse the full hub
          </Link>
        </p>
      ) : null}
    </div>
  );
}
