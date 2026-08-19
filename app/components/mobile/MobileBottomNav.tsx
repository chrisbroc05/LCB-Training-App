"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOptionalMobileApp } from "@/app/components/mobile/MobileAppProvider";

type MobileBottomNavProps = {
  hasBasicAccess: boolean;
};

type NavTab = {
  key: "home" | "playbook" | "train" | "account";
  label: string;
  href: string;
  locked?: boolean;
  isActive: (pathname: string) => boolean;
  icon: (active: boolean) => React.ReactNode;
};

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={active ? "currentColor" : "none"}
      />
    </svg>
  );
}

function BookIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 4h7a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H5V4Zm0 0h7a3 3 0 0 0-3 3v14a3 3 0 0 1 3-3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={active ? "currentColor" : "none"}
      />
    </svg>
  );
}

function PlayIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.8"
        fill={active ? "currentColor" : "none"}
      />
      <path d="M10 8.5v7l6-3.5-6-3.5Z" fill={active ? "#0A1628" : "currentColor"} />
    </svg>
  );
}

function PersonIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        fill={active ? "currentColor" : "none"}
      />
      <path
        d="M5 20a7 7 0 0 1 14 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 10V8a4 4 0 0 1 8 0v2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function MobileBottomNav({ hasBasicAccess }: MobileBottomNavProps) {
  const pathname = usePathname();
  const mobileApp = useOptionalMobileApp();

  const tabs: NavTab[] = [
    {
      key: "home",
      label: "Home",
      href: "/dashboard",
      isActive: (path) => path === "/dashboard",
      icon: (active) => <HomeIcon active={active} />,
    },
    {
      key: "playbook",
      label: "Playbook",
      href: "/playbook",
      locked: !hasBasicAccess,
      isActive: (path) => path.startsWith("/playbook"),
      icon: (active) => <BookIcon active={active} />,
    },
    {
      key: "train",
      label: "Train",
      href: "/drill-library",
      locked: !hasBasicAccess,
      isActive: (path) => path.startsWith("/drill-library") || path.startsWith("/resources"),
      icon: (active) => <PlayIcon active={active} />,
    },
    {
      key: "account",
      label: "Account",
      href: "/profile",
      isActive: (path) => path.startsWith("/profile") || path.startsWith("/settings"),
      icon: (active) => <PersonIcon active={active} />,
    },
  ];

  const handleTabPress = (
    event: React.MouseEvent<HTMLAnchorElement>,
    tab: NavTab,
  ) => {
    if (tab.locked) {
      event.preventDefault();
      mobileApp?.openUpgradeSheet(
        tab.key === "playbook"
          ? "Upgrade to Basic or above to unlock The Next Level Playbook."
          : "Upgrade to Basic or above to unlock the drill library and training videos.",
      );
    }
  };

  return (
    <nav className="mobile-bottom-nav md:hidden" aria-label="Mobile app navigation">
      <div className="mobile-bottom-nav-pill">
        {tabs.map((tab) => {
          const active = tab.isActive(pathname);
          const content = (
            <>
              <span className="mobile-bottom-nav-icon">
                {tab.locked ? <LockIcon /> : tab.icon(active)}
              </span>
              <span className="mobile-bottom-nav-label">{tab.label}</span>
            </>
          );

          return (
            <Link
              key={tab.key}
              href={tab.href}
              onClick={(event) => handleTabPress(event, tab)}
              className={`mobile-bottom-nav-tab mobile-tab-press ${active ? "is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
