"use client";

import AppHeaderBar from "@/app/components/AppHeaderBar";
import type { DatabaseTier } from "@/lib/membership";
import type { OrgTrialHeaderSummary } from "@/lib/layout-access-server";

type MobileAppHeaderProps = {
  membershipTier: DatabaseTier;
  hasProgramEnrollment?: boolean;
  userDisplayName: string;
  userEmail?: string | null;
  orgTrialHeader?: OrgTrialHeaderSummary | null;
  isAdmin?: boolean;
};

export default function MobileAppHeader({
  membershipTier,
  hasProgramEnrollment = false,
  userDisplayName,
  userEmail,
  orgTrialHeader = null,
  isAdmin = false,
}: MobileAppHeaderProps) {
  return (
    <header className="mobile-app-header md:hidden">
      <div className="mobile-app-header-inner app-header-bar">
        <AppHeaderBar
          membershipTier={membershipTier}
          hasProgramEnrollment={hasProgramEnrollment}
          userDisplayName={userDisplayName}
          userEmail={userEmail}
          orgTrialHeader={orgTrialHeader}
          variant="mobile"
          isAdmin={isAdmin}
        />
      </div>
    </header>
  );
}
