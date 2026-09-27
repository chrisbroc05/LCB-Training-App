"use client";

import Link from "next/link";
import BrandLogo from "@/app/BrandLogo";
import MobileNotificationBell from "@/app/components/mobile/MobileNotificationBell";
import { getMobileFirstName } from "@/lib/mobile-ui";
import { isTwelveWeekProgramMember, type DatabaseTier } from "@/lib/membership";

type AppHeaderBarProps = {
  membershipTier: DatabaseTier;
  userDisplayName: string;
  userEmail?: string | null;
  variant?: "mobile" | "desktop";
};

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M19.4 13.5a7.6 7.6 0 0 0 .1-3l2-1.5-2-3.5-2.3 1a7.7 7.7 0 0 0-2.6-1.5L14 2h-4l-.6 3a7.7 7.7 0 0 0-2.6 1.5l-2.3-1-2 3.5 2 1.5a7.6 7.6 0 0 0 0 3l-2 1.5 2 3.5 2.3-1a7.7 7.7 0 0 0 2.6 1.5L10 22h4l.6-3a7.7 7.7 0 0 0 2.6-1.5l2.3 1 2-3.5-2-1.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getInitial(name: string, email?: string | null) {
  const trimmed = name.trim();
  if (trimmed) {
    return trimmed.charAt(0).toUpperCase();
  }

  return (email?.charAt(0) ?? "M").toUpperCase();
}

export default function AppHeaderBar({
  membershipTier,
  userDisplayName,
  userEmail,
  variant = "mobile",
}: AppHeaderBarProps) {
  const firstName = getMobileFirstName(userDisplayName, userEmail);
  const initial = getInitial(userDisplayName, userEmail);
  const showProgramPill = isTwelveWeekProgramMember(membershipTier);

  return (
    <>
      <div className="app-header-left">
        <div className="app-header-brand-block">
          <Link href="/" className="app-header-brand-link">
            {variant === "desktop" ? (
              <span className="app-header-desktop-logo">
                <BrandLogo className="object-contain" />
              </span>
            ) : (
              <span className="app-header-brand-row">
                <span className="app-header-logo-mark" aria-hidden="true">
                  {"\u26BE"}
                </span>
                <span className="app-header-wordmark">LCB Training</span>
              </span>
            )}
          </Link>
          <span className="app-header-greeting-row">
            <span className="app-header-greeting">Hey, {firstName}</span>
            {showProgramPill ? (
              <Link href="/dashboard/today" className="app-header-program-pill">
                12-Week
              </Link>
            ) : null}
          </span>
        </div>
      </div>
      <div className="app-header-right">
        <MobileNotificationBell />
        <Link href="/settings" className="app-header-settings-button" aria-label="Settings">
          <SettingsIcon />
        </Link>
        <Link href="/profile" className="app-header-account-link" aria-label="Account">
          <span className="app-header-account-name">{firstName}</span>
          <span className="app-header-account-avatar">{initial}</span>
        </Link>
      </div>
    </>
  );
}
