"use client";

import AppHeaderBar from "@/app/components/AppHeaderBar";
import type { DatabaseTier } from "@/lib/membership";
import type { OrgTrialHeaderSummary } from "@/lib/layout-access-server";

type MobileAppHeaderProps = {
  membershipTier: DatabaseTier;
  userDisplayName: string;
  userEmail?: string | null;
  orgTrialHeader?: OrgTrialHeaderSummary | null;
};

export default function MobileAppHeader({
  membershipTier,
  userDisplayName,
  userEmail,
  orgTrialHeader = null,
}: MobileAppHeaderProps) {
  return (
    <header className="mobile-app-header md:hidden">
      <div className="mobile-app-header-inner app-header-bar">
        <AppHeaderBar
          membershipTier={membershipTier}
          userDisplayName={userDisplayName}
          userEmail={userEmail}
          orgTrialHeader={orgTrialHeader}
          variant="mobile"
        />
      </div>
    </header>
  );
}
