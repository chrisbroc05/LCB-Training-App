"use client";

import { usePathname } from "next/navigation";

type SiteShellProps = {
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
  adminToggle: React.ReactNode;
};

export default function SiteShell({ children, header, footer, adminToggle }: SiteShellProps) {
  const pathname = usePathname();
  const isStandaloneLanding = pathname.startsWith("/details");

  if (isStandaloneLanding) {
    return children;
  }

  return (
    <>
      {header}
      <main className="flex-1">{children}</main>
      {adminToggle}
      {footer}
    </>
  );
}
