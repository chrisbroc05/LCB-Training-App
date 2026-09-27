"use client";

import AppHeaderBar from "@/app/components/AppHeaderBar";
import type { DatabaseTier } from "@/lib/membership";

type MobileAppHeaderProps = {
  membershipTier: DatabaseTier;
  userDisplayName: string;
  userEmail?: string | null;
};

export default function MobileAppHeader({
  membershipTier,
  userDisplayName,
  userEmail,
}: MobileAppHeaderProps) {
  return (
    <header className="mobile-app-header md:hidden">
      <div className="mobile-app-header-inner app-header-bar">
        <AppHeaderBar
          membershipTier={membershipTier}
          userDisplayName={userDisplayName}
          userEmail={userEmail}
          variant="mobile"
        />
      </div>
    </header>
  );
}
