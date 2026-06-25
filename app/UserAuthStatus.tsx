"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

type UserAuthStatusProps = {
  isLoggedIn: boolean;
  displayName: string;
  membershipTier: "FREE" | "BASIC" | "PRO" | "ELITE";
  isAdminView?: boolean;
};

function formatTierLabel(tier: "FREE" | "BASIC" | "PRO" | "ELITE") {
  return tier.charAt(0) + tier.slice(1).toLowerCase();
}

export default function UserAuthStatus({
  isLoggedIn,
  displayName,
  membershipTier,
  isAdminView = false,
}: UserAuthStatusProps) {
  if (!isLoggedIn) {
    return (
      <a
        href="/auth"
        className="rounded-full border border-[#2b3650] px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:border-[#7f9434] hover:text-[#98b144] sm:px-4 sm:py-2 sm:text-sm"
      >
        Login
      </a>
    );
  }

  if (isAdminView) {
    return (
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/auth" })}
        className="rounded-full border border-[#22c55e]/70 bg-[#22c55e]/10 px-3 py-1.5 text-xs font-medium text-[#8df0b1] transition hover:bg-[#22c55e]/20 sm:px-4 sm:py-2 sm:text-sm"
      >
        Log Out
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <div className="max-w-full truncate rounded-full border border-[#2b3650] bg-black/40 px-3 py-1.5 text-[11px] text-zinc-200 sm:px-4 sm:py-2 sm:text-xs">
        <Link href="/profile" className="inline-block max-w-[110px] truncate align-bottom font-semibold text-zinc-100 transition hover:text-[#98b144] min-[400px]:max-w-[140px] sm:max-w-[180px]">
          {displayName}
        </Link>
        <span className="mx-2 text-zinc-500">|</span>
        <span className="text-[#98b144]">{formatTierLabel(membershipTier)}</span>
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/auth" })}
        className="rounded-full border border-[#22c55e]/70 bg-[#22c55e]/10 px-3 py-1.5 text-xs font-medium text-[#8df0b1] transition hover:bg-[#22c55e]/20 sm:px-4 sm:py-2 sm:text-sm"
      >
        Log Out
      </button>
    </div>
  );
}
