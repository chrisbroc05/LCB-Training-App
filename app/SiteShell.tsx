"use client";

import { usePathname } from "next/navigation";
import LandingSwingBanner from "@/app/LandingSwingBanner";
import MobileAppHeader from "@/app/components/mobile/MobileAppHeader";
import MobileBottomNav from "@/app/components/mobile/MobileBottomNav";
import { MobileAppProvider } from "@/app/components/mobile/MobileAppProvider";
import { shouldUseMobileAppChrome } from "@/lib/mobile-ui";
import type { DatabaseTier } from "@/lib/membership";

type SiteShellProps = {
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
  adminToggle: React.ReactNode;
  isLoggedIn: boolean;
  membershipTier: DatabaseTier;
  hasBasicAccess: boolean;
  userDisplayName: string;
  userEmail?: string | null;
};

export default function SiteShell({
  children,
  header,
  footer,
  adminToggle,
  isLoggedIn,
  membershipTier,
  hasBasicAccess,
  userDisplayName,
  userEmail,
}: SiteShellProps) {
  const pathname = usePathname();
  const isStandaloneLanding = pathname.startsWith("/details");
  const isHomePage = pathname === "/";
  const useMobileChrome = shouldUseMobileAppChrome(isLoggedIn, pathname);

  if (isStandaloneLanding) {
    return children;
  }

  const headerWrapperClass = useMobileChrome
    ? "sticky top-0 z-30 hidden md:block"
    : "sticky top-0 z-30";

  const shell = (
    <>
      <div className={headerWrapperClass}>
        {isHomePage ? <LandingSwingBanner isLoggedIn={isLoggedIn} /> : null}
        {header}
      </div>
      <main className={useMobileChrome ? "mobile-app-main flex-1 md:pb-0 md:pt-0" : "flex-1"}>
        {children}
      </main>
      {useMobileChrome ? (
        <>
          <MobileAppHeader
            membershipTier={membershipTier}
            userDisplayName={userDisplayName}
            userEmail={userEmail}
          />
          <MobileBottomNav hasBasicAccess={hasBasicAccess} />
        </>
      ) : null}
      {adminToggle}
      <div className={useMobileChrome ? "hidden md:block" : undefined}>{footer}</div>
    </>
  );

  if (useMobileChrome) {
    return (
      <MobileAppProvider membershipTier={membershipTier} hasBasicAccess={hasBasicAccess}>
        {shell}
      </MobileAppProvider>
    );
  }

  return shell;
}
