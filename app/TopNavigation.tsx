"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type TopNavigationProps = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  hasBasicAccess: boolean;
};

type MenuKey = "training" | "coaching" | "account";

type MenuLink = {
  label: string;
  href: string;
  isActive: (pathname: string) => boolean;
};

function linkClass(active: boolean) {
  return active
    ? "rounded-lg bg-[#22c55e]/15 px-3 py-2 text-sm font-semibold text-[#9df3bd]"
    : "rounded-lg px-3 py-2 text-sm text-zinc-200 transition hover:bg-[#1a253a] hover:text-[#9df3bd]";
}

export default function TopNavigation({ isLoggedIn, isAdmin, hasBasicAccess }: TopNavigationProps) {
  const pathname = usePathname();
  const [openDesktopMenu, setOpenDesktopMenu] = useState<MenuKey | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMenus = () => {
    setOpenDesktopMenu(null);
    setMobileOpen(false);
  };

  const trainingLinks = useMemo<MenuLink[]>(
    () => [
      {
        label: "Drill Library",
        href: "/dashboard",
        isActive: (path) => path === "/dashboard",
      },
      ...(hasBasicAccess
        ? [
            {
              label: "Workouts",
              href: "/workouts",
              isActive: (path: string) => path.startsWith("/workouts"),
            },
          ]
        : []),
    ],
    [hasBasicAccess],
  );

  const coachingLinks: MenuLink[] = [
    {
      label: "Swing Analysis",
      href: "/swing-analysis",
      isActive: (path) => path.startsWith("/swing-analysis"),
    },
    {
      label: "Mental Game Support",
      href: "/mental-game",
      isActive: (path) => path.startsWith("/mental-game"),
    },
  ];

  const accountLinks: MenuLink[] = [
    {
      label: "Profile",
      href: "/profile",
      isActive: (path) => path.startsWith("/profile"),
    },
    {
      label: "Settings",
      href: "/settings",
      isActive: (path) => path.startsWith("/settings"),
    },
  ];

  const renderDesktopDropdown = (key: MenuKey, title: string, links: MenuLink[]) => {
    const isOpen = openDesktopMenu === key;
    const parentActive = links.some((link) => link.isActive(pathname));
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenDesktopMenu((current) => (current === key ? null : key))}
          className={
            parentActive
              ? "rounded-lg bg-[#22c55e]/15 px-3 py-2 text-sm font-semibold text-[#9df3bd]"
              : "rounded-lg px-3 py-2 text-sm text-zinc-200 transition hover:bg-[#1a253a] hover:text-[#9df3bd]"
          }
        >
          {title}
        </button>
        {isOpen && (
          <div className="absolute right-0 z-30 mt-2 min-w-56 rounded-xl border border-[#2b3650] bg-[#0b1324] p-2 shadow-2xl shadow-black/50">
            {links.map((link) => (
              <Link
                key={`${title}-${link.href}`}
                href={link.href}
                onClick={closeMenus}
                className={linkClass(link.isActive(pathname))}
              >
                {link.label}
              </Link>
            ))}
            {key === "account" && (
              <button
                type="button"
                onClick={() => {
                  closeMenus();
                  void signOut({ callbackUrl: "/auth" });
                }}
                className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-red-200 transition hover:bg-red-500/15"
              >
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isAdmin) {
    return (
      <nav className="ml-auto flex items-center gap-2">
        <Link href="/admin" onClick={closeMenus} className={linkClass(pathname.startsWith("/admin"))}>
          Admin Dashboard
        </Link>
        <button
          type="button"
          onClick={() => {
            closeMenus();
            void signOut({ callbackUrl: "/auth" });
          }}
          className="rounded-lg px-3 py-2 text-sm text-zinc-200 transition hover:bg-[#1a253a] hover:text-[#9df3bd]"
        >
          Logout
        </button>
      </nav>
    );
  }

  if (!isLoggedIn) {
    return (
      <nav className="ml-auto">
        <Link href="/auth" onClick={closeMenus} className={linkClass(pathname.startsWith("/auth"))}>
          Login
        </Link>
      </nav>
    );
  }

  return (
    <nav className="ml-auto">
      <div className="hidden items-center gap-1 md:flex">
        <Link href="/dashboard" onClick={closeMenus} className={linkClass(pathname === "/dashboard")}>
          Dashboard
        </Link>
        {renderDesktopDropdown("training", "Training", trainingLinks)}
        {renderDesktopDropdown("coaching", "Coaching", coachingLinks)}
        {renderDesktopDropdown("account", "Account", accountLinks)}
      </div>

      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          className="rounded-lg border border-[#2b3650] bg-[#0b1324] px-3 py-2 text-xl leading-none text-zinc-100"
          aria-label="Toggle navigation menu"
        >
          ?
        </button>
        {mobileOpen && (
          <div className="absolute left-4 right-4 top-[68px] z-30 rounded-xl border border-[#2b3650] bg-[#0b1324] p-4 shadow-2xl shadow-black/50">
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Main</p>
                <Link href="/dashboard" onClick={closeMenus} className={linkClass(pathname === "/dashboard")}>
                  Dashboard
                </Link>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Training</p>
                {trainingLinks.map((link) => (
                  <Link
                    key={`mobile-training-${link.href}`}
                    href={link.href}
                    onClick={closeMenus}
                    className={linkClass(link.isActive(pathname))}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Coaching</p>
                {coachingLinks.map((link) => (
                  <Link
                    key={`mobile-coaching-${link.href}`}
                    href={link.href}
                    onClick={closeMenus}
                    className={linkClass(link.isActive(pathname))}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Account</p>
                {accountLinks.map((link) => (
                  <Link
                    key={`mobile-account-${link.href}`}
                    href={link.href}
                    onClick={closeMenus}
                    className={linkClass(link.isActive(pathname))}
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    closeMenus();
                    void signOut({ callbackUrl: "/auth" });
                  }}
                  className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-red-200 transition hover:bg-red-500/15"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
