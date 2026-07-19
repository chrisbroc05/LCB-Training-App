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

type NavLink = {
  label: string;
  href: string;
  isActive: (pathname: string) => boolean;
};

type NavGroup = {
  label: string;
  links: NavLink[];
};

function linkClass(active: boolean) {
  return active
    ? "rounded-lg bg-[#22c55e]/15 px-3 py-2 text-sm font-semibold text-[#9df3bd]"
    : "rounded-lg px-3 py-2 text-sm text-zinc-200 transition hover:bg-[#1a253a] hover:text-[#9df3bd]";
}

function dropdownItemClass(active: boolean) {
  return active
    ? "block rounded-lg bg-[#22c55e]/15 px-3 py-2 text-sm font-semibold text-[#9df3bd]"
    : "block rounded-lg px-3 py-2 text-sm text-zinc-200 transition hover:bg-[#1a253a] hover:text-[#9df3bd]";
}

function isAnyLinkActive(links: NavLink[], pathname: string) {
  return links.some((link) => link.isActive(pathname));
}

function buildTrainLinks(): NavLink[] {
  return [
    {
      label: "Drill Library",
      href: "/drill-library",
      isActive: (path) => path.startsWith("/drill-library"),
    },
    {
      label: "Resources",
      href: "/resources",
      isActive: (path) => path.startsWith("/resources"),
    },
  ];
}

function buildCoachingLinks(): NavLink[] {
  return [
    {
      label: "Coaching Submissions",
      href: "/coaching-submissions",
      isActive: (path) =>
        path.startsWith("/coaching-submissions") ||
        path.startsWith("/swing-analysis") ||
        path.startsWith("/mental-game"),
    },
    {
      label: "Goal Check-In",
      href: "/goal-setting",
      isActive: (path) => path.startsWith("/goal-setting"),
    },
  ];
}

function buildAccountLinks(): NavLink[] {
  return [
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
}

function HamburgerIcon() {
  return (
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
  );
}

function DesktopDropdown({
  group,
  pathname,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive = isAnyLinkActive(group.links, pathname);

  return (
    <div className="group relative">
      <button
        type="button"
        className={`${linkClass(isActive)} inline-flex items-center gap-1`}
        aria-haspopup="true"
      >
        {group.label}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          className="opacity-70"
        >
          <path d="M2 4 L6 8 L10 4" />
        </svg>
      </button>
      <div className="invisible absolute left-0 top-full z-40 mt-1 min-w-[220px] rounded-xl border border-[#2b3650] bg-[#0b1324] p-2 opacity-0 shadow-2xl shadow-black/50 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        {group.links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={dropdownItemClass(link.isActive(pathname))}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function DesktopAccountDropdown({
  pathname,
  onLogout,
}: {
  pathname: string;
  onLogout: () => void;
}) {
  const accountLinks = buildAccountLinks();
  const isActive = isAnyLinkActive(accountLinks, pathname);

  return (
    <div className="group relative">
      <button
        type="button"
        className={`${linkClass(isActive)} inline-flex items-center gap-1`}
        aria-haspopup="true"
      >
        Account
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          className="opacity-70"
        >
          <path d="M2 4 L6 8 L10 4" />
        </svg>
      </button>
      <div className="invisible absolute right-0 top-full z-40 mt-1 min-w-[220px] rounded-xl border border-[#2b3650] bg-[#0b1324] p-2 opacity-0 shadow-2xl shadow-black/50 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        {accountLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={dropdownItemClass(link.isActive(pathname))}
          >
            {link.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={onLogout}
          className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-red-200 transition hover:bg-red-500/15"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

function MobileNavGroup({
  title,
  links,
  pathname,
  onNavigate,
}: {
  title: string;
  links: NavLink[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</p>
      <div className="space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={linkClass(link.isActive(pathname))}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
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

  const closeMenus = () => {
    setMobileOpen(false);
  };

  const handleLogout = () => {
    closeMenus();
    void signOut({ callbackUrl: "/auth" });
  };

  if (isAdmin && pathname.startsWith("/admin")) {
    return (
      <nav className="flex items-center justify-end gap-2 md:justify-self-end">
        <button
          type="button"
          onClick={handleLogout}
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

  const trainGroup: NavGroup = { label: "Train", links: buildTrainLinks() };
  const coachingGroup: NavGroup = { label: "Coaching", links: buildCoachingLinks() };

  return (
    <nav className="flex justify-end md:justify-self-end">
      <div className="hidden items-center gap-1 md:flex">
        <Link
          href="/dashboard"
          onClick={closeMenus}
          className={linkClass(pathname === "/dashboard")}
        >
          Dashboard
        </Link>

        {hasBasicAccess ? (
          <DesktopDropdown group={trainGroup} pathname={pathname} onNavigate={closeMenus} />
        ) : null}

        {hasCoachingAccess ? (
          <DesktopDropdown group={coachingGroup} pathname={pathname} onNavigate={closeMenus} />
        ) : null}

        <DesktopAccountDropdown pathname={pathname} onLogout={handleLogout} />

        {userDisplayName ? (
          <span className="ml-2 border-l border-[#2b3650] pl-3 text-xs font-medium text-[#52B788]">
            {userDisplayName}
          </span>
        ) : null}
      </div>

      <div className="relative md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          className="rounded-lg border border-[#2b3650] bg-[#0b1324] px-3 py-2 text-zinc-100"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          <HamburgerIcon />
        </button>
        {mobileOpen ? (
          <div className="absolute left-4 right-4 top-[68px] z-30 rounded-xl border border-[#2b3650] bg-[#0b1324] p-4 shadow-2xl shadow-black/50">
            <div className="space-y-5">
              {userDisplayName ? (
                <p className="text-sm font-medium text-[#52B788]">{userDisplayName}</p>
              ) : null}

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Dashboard
                </p>
                <Link
                  href="/dashboard"
                  onClick={closeMenus}
                  className={linkClass(pathname === "/dashboard")}
                >
                  Dashboard
                </Link>
              </div>

              {hasBasicAccess ? (
                <MobileNavGroup
                  title="Train"
                  links={trainGroup.links}
                  pathname={pathname}
                  onNavigate={closeMenus}
                />
              ) : null}

              {hasCoachingAccess ? (
                <MobileNavGroup
                  title="Coaching"
                  links={coachingGroup.links}
                  pathname={pathname}
                  onNavigate={closeMenus}
                />
              ) : null}

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Account
                </p>
                <div className="space-y-1">
                  {buildAccountLinks().map((link) => (
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
                    onClick={handleLogout}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-200 transition hover:bg-red-500/15"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
