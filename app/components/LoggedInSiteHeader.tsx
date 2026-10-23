"use client";

import AppHeaderBar from "@/app/components/AppHeaderBar";
import TopNavigation from "@/app/TopNavigation";
import type { DatabaseTier } from "@/lib/membership";
import type { OrgTrialHeaderSummary } from "@/lib/layout-access-server";

type LoggedInSiteHeaderProps = {
  membershipTier: DatabaseTier;
  userDisplayName: string;
  userEmail?: string | null;
  isAdmin: boolean;
  hasDrillLibraryAccess: boolean;
  hasPlaybookAccess: boolean;
  hasMemberDownloadsAccess: boolean;
  hasCoachingAccess: boolean;
  hasProgramEnrollment: boolean;
  orgTrialHeader: OrgTrialHeaderSummary | null;
};

export default function LoggedInSiteHeader({
  membershipTier,
  userDisplayName,
  userEmail,
  isAdmin,
  hasDrillLibraryAccess,
  hasPlaybookAccess,
  hasMemberDownloadsAccess,
  hasCoachingAccess,
  hasProgramEnrollment,
  orgTrialHeader,
}: LoggedInSiteHeaderProps) {
  return (
    <header className="logged-in-site-header border-b border-[#18243a] bg-black/95 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6">
        <div className="app-header-bar app-header-bar-desktop">
          <AppHeaderBar
            membershipTier={membershipTier}
            userDisplayName={userDisplayName}
            userEmail={userEmail}
            orgTrialHeader={orgTrialHeader}
            variant="desktop"
          />
        </div>
        <div className="mt-3 border-t border-[#18243a] pt-3">
          <TopNavigation
            isLoggedIn
            isAdmin={isAdmin}
            hasDrillLibraryAccess={hasDrillLibraryAccess}
            hasPlaybookAccess={hasPlaybookAccess}
            hasMemberDownloadsAccess={hasMemberDownloadsAccess}
            hasCoachingAccess={hasCoachingAccess}
            hasProgramEnrollment={hasProgramEnrollment}
            userDisplayName={userDisplayName}
          />
        </div>
      </div>
    </header>
  );
}
