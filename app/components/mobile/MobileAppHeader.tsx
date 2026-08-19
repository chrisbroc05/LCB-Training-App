"use client";

import Link from "next/link";
import { useOptionalMobileApp } from "@/app/components/mobile/MobileAppProvider";
import MobileNotificationBell from "@/app/components/mobile/MobileNotificationBell";
import { getMobileFirstName, getMobileTierBadge } from "@/lib/mobile-ui";
import type { DatabaseTier } from "@/lib/membership";

type MobileAppHeaderProps = {
  membershipTier: DatabaseTier;
  userDisplayName: string;
  userEmail?: string | null;
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

export default function MobileAppHeader({
  membershipTier,
  userDisplayName,
  userEmail,
}: MobileAppHeaderProps) {
  const mobileApp = useOptionalMobileApp();
  const firstName = getMobileFirstName(userDisplayName, userEmail);
  const tierBadge = getMobileTierBadge(membershipTier);

  return (
    <header className="mobile-app-header md:hidden">
      <div className="mobile-app-header-inner">
        <div className="mobile-app-header-left">
          <Link href="/" className="mobile-app-brand-link">
            <span className="mobile-app-brand-row">
              <span className="mobile-app-logo-mark" aria-hidden="true">
                {"\u26BE"}
              </span>
              <span className="mobile-app-wordmark">LCB Training</span>
            </span>
            <span className="mobile-app-user-greeting">Hey, {firstName}</span>
          </Link>
        </div>
        <div className="mobile-app-header-center" aria-hidden="true" />
        <div className="mobile-app-header-right">
          <button
            type="button"
            onClick={() => mobileApp?.openUpgradeSheet()}
            className={`mobile-tier-pill ${tierBadge.className}`}
          >
            {tierBadge.label}
          </button>
          <MobileNotificationBell />
          <Link href="/settings" className="mobile-settings-button" aria-label="Settings">
            <SettingsIcon />
          </Link>
        </div>
      </div>
    </header>
  );
}
