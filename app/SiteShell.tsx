"use client";

import { usePathname } from "next/navigation";
import LandingSwingBanner from "@/app/LandingSwingBanner";
import LandingHeader from "@/app/LandingHeader";
import MobileAppHeader from "@/app/components/mobile/MobileAppHeader";
import MobileBottomNav from "@/app/components/mobile/MobileBottomNav";
import MobilePageTransition from "@/app/components/mobile/MobilePageTransition";
import { MobileAppProvider } from "@/app/components/mobile/MobileAppProvider";
import MessageChatBubble from "@/components/MessageChatBubble";
import PublicPageShell from "@/components/PublicPageShell";
import { shouldUseMobileAppChrome } from "@/lib/mobile-ui";
import { isCompactPublicPage } from "@/lib/public-page-routes";
import type { DatabaseTier } from "@/lib/membership";
import type { OrgTrialHeaderSummary } from "@/lib/layout-access-server";

type SiteShellProps = {
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
  adminToggle: React.ReactNode;
  isLoggedIn: boolean;
  membershipTier: DatabaseTier;
  currentPlanLabel: string;
  hasDrillLibraryAccess: boolean;
  hasPlaybookAccess: boolean;
  hasMemberDownloadsAccess: boolean;
  hasProgramEnrollment: boolean;
  orgTrialHeader: OrgTrialHeaderSummary | null;
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
  currentPlanLabel,
  hasDrillLibraryAccess,
  hasPlaybookAccess,
  hasMemberDownloadsAccess,
  hasProgramEnrollment,
  orgTrialHeader,
  userDisplayName,
  userEmail,
}: SiteShellProps) {
  const pathname = usePathname();
  const isStandaloneLanding = pathname.startsWith("/details") || pathname.startsWith("/remote");
  const isCompactPublic = isCompactPublicPage(pathname);
  const isHomePage = pathname === "/";
  const useMobileChrome = shouldUseMobileAppChrome(isLoggedIn, pathname);
  const onAdminRoute = pathname.startsWith("/admin");

  if (isStandaloneLanding || isCompactPublic) {
    if (isCompactPublic) {
      return <PublicPageShell isLoggedIn={isLoggedIn}>{children}</PublicPageShell>;
    }

    return children;
  }

  const headerWrapperClass = useMobileChrome
    ? "sticky top-0 z-30 hidden md:block"
    : "sticky top-0 z-30";

  const shell = (
    <>
      {useMobileChrome ? (
        <MobileAppHeader
          membershipTier={membershipTier}
          userDisplayName={userDisplayName}
          userEmail={userEmail}
          orgTrialHeader={orgTrialHeader}
        />
      ) : null}
      <div className={headerWrapperClass}>
        {isHomePage ? <LandingSwingBanner isLoggedIn={isLoggedIn} /> : null}
        {isHomePage ? <LandingHeader isLoggedIn={isLoggedIn} /> : header}
      </div>
      <main className={useMobileChrome ? "mobile-app-main flex-1 md:pb-0 md:pt-0" : "flex-1"}>
        {useMobileChrome ? <MobilePageTransition>{children}</MobilePageTransition> : children}
      </main>
      {useMobileChrome && !onAdminRoute ? (
        <MobileBottomNav
          hasDrillLibraryAccess={hasDrillLibraryAccess}
          hasPlaybookAccess={hasPlaybookAccess}
          hasProgramEnrollment={hasProgramEnrollment}
        />
      ) : null}
      {!onAdminRoute ? adminToggle : null}
      <MessageChatBubble isLoggedIn={isLoggedIn} />
      <div className={useMobileChrome ? "hidden md:block" : undefined}>{footer}</div>
    </>
  );

  if (useMobileChrome) {
    return (
      <MobileAppProvider
        membershipTier={membershipTier}
        currentPlanLabel={currentPlanLabel}
        hasPlaybookAccess={hasPlaybookAccess}
      >
        {shell}
      </MobileAppProvider>
    );
  }

  return shell;
}
