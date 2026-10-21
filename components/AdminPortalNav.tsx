"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminMessagesNavLink from "@/components/AdminMessagesNavLink";

const ADMIN_PORTAL_LINKS = [
  {
    href: "/admin/program",
    label: "12-Week Program",
    isActive: (pathname: string) => pathname.startsWith("/admin/program"),
  },
  {
    href: "/admin/waivers",
    label: "Signed Waivers",
    isActive: (pathname: string) => pathname.startsWith("/admin/waivers"),
  },
  {
    href: "/admin/drill-starter",
    label: "Starter Drills",
    isActive: (pathname: string) => pathname.startsWith("/admin/drill-starter"),
  },
  {
    href: "/admin/leads",
    label: "Leads",
    isActive: (pathname: string) => pathname.startsWith("/admin/leads"),
  },
] as const;

function adminPortalLinkClass(active: boolean) {
  return active
    ? "inline-flex items-center rounded-lg bg-[#1a253a] px-3 py-2 text-sm font-medium text-[#9df3bd]"
    : "inline-flex items-center rounded-lg px-3 py-2 text-sm text-zinc-200 transition hover:bg-[#1a253a] hover:text-[#9df3bd]";
}

export default function AdminPortalNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2" aria-label="Admin portal">
      {ADMIN_PORTAL_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={adminPortalLinkClass(link.isActive(pathname))}
        >
          {link.label}
        </Link>
      ))}
      <AdminMessagesNavLink />
    </nav>
  );
}
