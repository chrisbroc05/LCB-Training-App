"use client";

import { signOut } from "next-auth/react";

type SignOutButtonProps = {
  className?: string;
};

export default function SignOutButton({ className = "" }: SignOutButtonProps) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className={`w-full rounded-full border border-red-500 px-6 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-500/10 ${className}`.trim()}
    >
      Sign Out
    </button>
  );
}
