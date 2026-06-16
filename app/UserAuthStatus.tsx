"use client";

import { signOut } from "next-auth/react";

type UserAuthStatusProps = {
  isLoggedIn: boolean;
  displayName: string;
  membershipTier: "BASIC" | "PRO" | "ELITE";
};

function formatTierLabel(tier: "BASIC" | "PRO" | "ELITE") {
  return tier.charAt(0) + tier.slice(1).toLowerCase();
}

export default function UserAuthStatus({
  isLoggedIn,
  displayName,
  membershipTier,
}: UserAuthStatusProps) {
  if (!isLoggedIn) {
    return (
      <a
        href="/auth"
        className="rounded-full border border-[#2b3650] px-4 py-2 font-medium text-zinc-100 transition hover:border-[#7f9434] hover:text-[#98b144]"
      >
        Login
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="rounded-full border border-[#2b3650] bg-black/40 px-4 py-2 text-xs text-zinc-200">
        <span className="font-semibold text-zinc-100">{displayName}</span>
        <span className="mx-2 text-zinc-500">|</span>
        <span className="text-[#98b144]">{formatTierLabel(membershipTier)}</span>
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/auth" })}
        className="rounded-full border border-[#22c55e]/70 bg-[#22c55e]/10 px-4 py-2 font-medium text-[#8df0b1] transition hover:bg-[#22c55e]/20"
      >
        Log Out
      </button>
    </div>
  );
}
