"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ADMIN_MOBILE_TABS,
  ADMIN_NAV_SECTIONS,
  adminMobileTabActive,
} from "@/lib/admin-nav-shared";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";
import AdminViewToggleInline from "@/app/AdminViewToggleInline";

type NavCounts = {
  coachingBadge: number;
};

function navLinkClass(active: boolean) {
  return active
    ? "block rounded-lg bg-[#1a253a] px-3 py-2 text-sm font-medium text-[#9df3bd]"
    : "block rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-[#1a253a] hover:text-[#9df3bd]";
}

function isNavItemActive(pathname: string, item: { href: string; matchPrefix: string }) {
  if (item.href === ADMIN_ROUTES.messages) {
    return pathname.startsWith("/admin/messages");
  }
  if (item.matchPrefix === `${ADMIN_ROUTES.coaching.program}`) {
    return (
      pathname === ADMIN_ROUTES.coaching.program ||
      pathname.startsWith(`${ADMIN_ROUTES.coaching.program}/`)
    );
  }
  return pathname === item.href || pathname.startsWith(`${item.matchPrefix}/`);
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [navCounts, setNavCounts] = useState<NavCounts | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/admin/nav-counts", { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as NavCounts;
      setNavCounts(data);
    };
    void load();
  }, [pathname]);

  const coachingBadge = navCounts?.coachingBadge ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 md:gap-8">
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-24 space-y-6 pb-8">
          <Link href={ADMIN_ROUTES.today} className={navLinkClass(pathname === ADMIN_ROUTES.today)}>
            Today
          </Link>
          {ADMIN_NAV_SECTIONS.map((section) => (
            <div key={section.id}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {section.label}
              </p>
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const active = isNavItemActive(pathname, item);
                  const showBadge =
                    section.id === "coaching" &&
                    item.href === ADMIN_ROUTES.coaching.reviews &&
                    coachingBadge > 0;
                  return (
                    <Link key={item.href} href={item.href} className={navLinkClass(active)}>
                      <span className="flex items-center justify-between gap-2">
                        <span>{item.label}</span>
                        {showBadge ? (
                          <span className="rounded-full bg-[#22c55e] px-2 py-0.5 text-xs font-semibold text-black">
                            {coachingBadge > 99 ? "99+" : coachingBadge}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
          <div className="border-t border-[#18243a] pt-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              View
            </p>
            <div className="px-3">
              <AdminViewToggleInline />
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-24 md:pb-10">
        {children}
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[#18243a] bg-[#0A1628]/95 backdrop-blur md:hidden"
        aria-label="Admin sections"
      >
        <ul className="mx-auto flex max-w-lg justify-around px-1 py-2">
          {ADMIN_MOBILE_TABS.map((tab) => {
            const active = adminMobileTabActive(pathname, tab);
            return (
              <li key={tab.id}>
                <Link
                  href={tab.href}
                  className={`flex flex-col items-center px-2 py-1 text-[10px] font-semibold ${
                    active ? "text-[#9df3bd]" : "text-zinc-400"
                  }`}
                >
                  {tab.label}
                  {tab.id === "coaching" && coachingBadge > 0 ? (
                    <span className="mt-0.5 rounded-full bg-[#22c55e] px-1.5 text-[9px] text-black">
                      {coachingBadge > 99 ? "99+" : coachingBadge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
