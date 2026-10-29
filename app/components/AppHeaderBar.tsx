"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import BrandLogo from "@/app/BrandLogo";
import AppHeaderAccountMenu from "@/app/components/AppHeaderAccountMenu";
import MobileNotificationBell from "@/app/components/mobile/MobileNotificationBell";
import OrgTrialDetailsModal from "@/app/components/OrgTrialDetailsModal";
import type { OrgTrialHeaderSummary } from "@/lib/layout-access-server";
import { getMobileFirstName } from "@/lib/mobile-ui";
import { type DatabaseTier } from "@/lib/membership";

type AppHeaderBarProps = {
  membershipTier: DatabaseTier;
  hasProgramEnrollment?: boolean;
  userDisplayName: string;
  userEmail?: string | null;
  orgTrialHeader?: OrgTrialHeaderSummary | null;
  variant?: "mobile" | "desktop";
  isAdmin?: boolean;
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
  membershipTier: _membershipTier,
  hasProgramEnrollment = false,
  userDisplayName,
  userEmail,
  orgTrialHeader = null,
  variant = "mobile",
  isAdmin = false,
}: AppHeaderBarProps) {
  const pathname = usePathname();
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const firstName = getMobileFirstName(userDisplayName, userEmail);
  const initial = getInitial(userDisplayName, userEmail);
  const showProgramPill = hasProgramEnrollment;
  const showAdminPill = isAdmin && !pathname.startsWith("/admin");

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
            {orgTrialHeader ? (
              <button
                type="button"
                onClick={() => setTrialModalOpen(true)}
                className="app-header-program-pill"
              >
                Trial
              </button>
            ) : null}
            {showProgramPill ? (
              <Link href="/dashboard/today" className="app-header-program-pill">
                12-Week
              </Link>
            ) : null}
            {showAdminPill ? (
              <Link href="/admin" className="app-header-admin-pill">
                Admin
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
        <AppHeaderAccountMenu isAdmin={isAdmin} firstName={firstName} initial={initial} />
      </div>

      {orgTrialHeader ? (
        <OrgTrialDetailsModal
          open={trialModalOpen}
          onClose={() => setTrialModalOpen(false)}
          orgName={orgTrialHeader.orgName}
          endLabel={orgTrialHeader.endLabel}
          teamName={orgTrialHeader.teamName}
        />
      ) : null}
    </>
  );
}
