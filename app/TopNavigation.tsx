"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type TopNavigationProps = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  hasBasicAccess: boolean;
  hasCoachingAccess: boolean;
  userDisplayName?: string;
};

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

export default function TopNavigation({
  isLoggedIn,
  isAdmin,
  hasBasicAccess,
  hasCoachingAccess,
  userDisplayName,
}: TopNavigationProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const showGreeting = Boolean(
    isLoggedIn && userDisplayName && pathname !== "/" && !pathname.startsWith("/auth"),
  );

  const closeMenus = () => {
    setMobileOpen(false);
  };

  const mainLinks: MenuLink[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      isActive: (path) => path === "/dashboard",
    },
    ...(hasBasicAccess
      ? [
          {
            label: "Drill Library",
            href: "/drill-library",
            isActive: (path: string) => path.startsWith("/drill-library"),
          },
          {
            label: "Resources",
            href: "/resources",
            isActive: (path: string) => path.startsWith("/resources"),
          },
        ]
      : []),
    ...(hasCoachingAccess
      ? [
          {
            label: "Coaching Submissions",
            href: "/coaching-submissions",
            isActive: (path: string) =>
              path.startsWith("/coaching-submissions") ||
              path.startsWith("/swing-analysis") ||
              path.startsWith("/mental-game"),
          },
        ]
      : []),
    {
      label: "Account",
      href: "/settings",
      isActive: (path) => path.startsWith("/settings") || path.startsWith("/profile"),
    },
  ];

  if (isAdmin && pathname.startsWith("/admin")) {
    return (
      <nav className="flex items-center justify-end gap-2 md:justify-self-end">
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
      <nav className="flex items-center justify-end gap-1 md:justify-self-end">
        <Link href="/auth" onClick={closeMenus} className={linkClass(pathname.startsWith("/auth"))}>
          Login
        </Link>
        <Link href="/auth?mode=signup" onClick={closeMenus} className={linkClass(false)}>
          Sign Up
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex justify-end md:justify-self-end">
      <div className="hidden items-center gap-1 md:flex">
        {mainLinks.map((link) => (
          <Link
            key={link.href}
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
          className="rounded-lg px-3 py-2 text-sm text-zinc-200 transition hover:bg-[#1a253a] hover:text-red-200"
        >
          Logout
        </button>

        {showGreeting ? (
          <span className="px-2 text-xs font-medium text-[#52B788]">{userDisplayName}</span>
        ) : null}
      </div>

      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          className="rounded-lg border border-[#2b3650] bg-[#0b1324] px-3 py-2 text-zinc-100"
          aria-label="Toggle navigation menu"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        {mobileOpen ? (
          <div className="absolute left-4 right-4 top-[68px] z-30 rounded-xl border border-[#2b3650] bg-[#0b1324] p-4 shadow-2xl shadow-black/50">
            <div className="space-y-4">
              {showGreeting ? (
                <p className="text-sm font-medium text-[#52B788]">{userDisplayName}</p>
              ) : null}

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Menu</p>
                {mainLinks.map((link) => (
                  <Link
                    key={`mobile-${link.href}`}
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
        ) : null}
      </div>
    </nav>
  );
}
