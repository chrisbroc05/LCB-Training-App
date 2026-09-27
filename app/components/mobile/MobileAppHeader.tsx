"use client";

import Link from "next/link";
import MobileNotificationBell from "@/app/components/mobile/MobileNotificationBell";
import { getMobileFirstName } from "@/lib/mobile-ui";

type MobileAppHeaderProps = {
  userDisplayName: string;
  userEmail?: string | null;
};

function getInitial(name: string, email?: string | null) {
  const trimmed = name.trim();
  if (trimmed) {
    return trimmed.charAt(0).toUpperCase();
  }

  return (email?.charAt(0) ?? "M").toUpperCase();
}

export default function MobileAppHeader({
  userDisplayName,
  userEmail,
}: MobileAppHeaderProps) {
  const firstName = getMobileFirstName(userDisplayName, userEmail);
  const initial = getInitial(userDisplayName, userEmail);

  return (
    <header className="mobile-app-header md:hidden">
      <div className="mobile-app-header-inner">
        <div className="mobile-app-header-left">
          <Link href="/dashboard" className="mobile-app-brand-link">
            <span className="mobile-app-brand-row">
              <span className="mobile-app-logo-mark" aria-hidden="true">
                {"\u26BE"}
              </span>
              <span className="mobile-app-wordmark">LCB Training</span>
            </span>
          </Link>
        </div>
        <div className="mobile-app-header-right">
          <MobileNotificationBell />
          <Link href="/profile" className="mobile-account-link" aria-label="Account">
            <span className="mobile-account-name">{firstName}</span>
            <span className="mobile-account-avatar">{initial}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
