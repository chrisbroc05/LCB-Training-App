"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function toggleSegmentClass(active: boolean) {
  return active
    ? "rounded-full bg-[#22c55e] px-3 py-1.5 text-xs font-semibold text-black"
    : "rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:text-[#9df3bd]";
}

export default function AdminViewToggle({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  if (!isAdmin) {
    return null;
  }

  const onAdmin = pathname.startsWith("/admin");

  return (
    <div
      className="fixed bottom-4 right-4 z-40 flex rounded-full border border-[#2b3650] bg-[#0b1324]/95 p-1 shadow-lg shadow-black/40 backdrop-blur"
      aria-label="Switch between member and admin views"
    >
      <Link href="/dashboard" className={toggleSegmentClass(!onAdmin)}>
        Member
      </Link>
      <Link href="/admin" className={toggleSegmentClass(onAdmin)}>
        Admin
      </Link>
    </div>
  );
}
