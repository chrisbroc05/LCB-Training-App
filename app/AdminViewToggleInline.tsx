"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminViewToggleInline() {
  const pathname = usePathname();
  const onAdmin = pathname.startsWith("/admin");

  if (!onAdmin) {
    return null;
  }

  return (
    <Link
      href="/dashboard"
      className="inline-flex rounded-full border border-[#2b3650] bg-[#1a253a] px-4 py-2 text-sm font-semibold text-[#9df3bd] transition hover:border-[#52B788]/40 hover:text-[#52B788]"
    >
      Switch to member view
    </Link>
  );
}
