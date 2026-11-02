import type { ComponentPropsWithoutRef, ReactNode } from "react";

type MemberPdfOpenLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href" | "target" | "rel"> & {
  href: string;
  children: ReactNode;
};

/** Opens member PDFs in the system viewer (new tab) via the signed open API. */
export default function MemberPdfOpenLink({
  href,
  className,
  children,
  ...rest
}: MemberPdfOpenLinkProps) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...rest}>
      {children}
    </a>
  );
}
