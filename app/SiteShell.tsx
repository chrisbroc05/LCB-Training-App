"use client";

import { usePathname } from "next/navigation";
import LandingSwingBanner from "@/app/LandingSwingBanner";

type SiteShellProps = {
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
  adminToggle: React.ReactNode;
  isLoggedIn: boolean;
};

export default function SiteShell({
  children,
  header,
  footer,
  adminToggle,
  isLoggedIn,
}: SiteShellProps) {
  const pathname = usePathname();
  const isStandaloneLanding = pathname.startsWith("/details");
  const isHomePage = pathname === "/";

  if (isStandaloneLanding) {
    return children;
  }

  return (
    <>
      <div className="sticky top-0 z-30">
        {isHomePage ? <LandingSwingBanner isLoggedIn={isLoggedIn} /> : null}
        {header}
      </div>
      <main className="flex-1">{children}</main>
      {adminToggle}
      {footer}
    </>
  );
}
