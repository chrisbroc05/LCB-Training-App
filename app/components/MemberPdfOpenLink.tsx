"use client";

import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from "react";
import { buildMemberPdfUnavailablePath } from "@/lib/member-pdf-unavailable-shared";

type MemberPdfOpenLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href" | "target" | "rel"> & {
  href: string;
  children: ReactNode;
};

/**
 * Mints a signed go URL with the current session (fetch), then opens the PDF in a new tab.
 * The go route does not require cookies; works in Safari and home-screen PWAs.
 */
export default function MemberPdfOpenLink({
  href,
  className,
  children,
  onClick,
  ...rest
}: MemberPdfOpenLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) {
      return;
    }

    event.preventDefault();

    const handoffUrl = new URL(href, window.location.origin);
    const mintUrl = `/api/member/pdf/mint?${handoffUrl.searchParams.toString()}`;

    void (async () => {
      const response = await fetch(mintUrl, { credentials: "include" });
      if (!response.ok) {
        const code =
          response.status === 401 ? "sign-in" : response.status === 403 ? "forbidden" : "error";
        window.open(buildMemberPdfUnavailablePath(code), "_blank", "noopener,noreferrer");
        return;
      }

      const data = (await response.json()) as { goUrl?: string };
      if (!data.goUrl) {
        window.open(buildMemberPdfUnavailablePath("error"), "_blank", "noopener,noreferrer");
        return;
      }

      window.open(data.goUrl, "_blank", "noopener,noreferrer");
    })();
  };

  return (
    <a href={href} onClick={handleClick} className={className} {...rest}>
      {children}
    </a>
  );
}
