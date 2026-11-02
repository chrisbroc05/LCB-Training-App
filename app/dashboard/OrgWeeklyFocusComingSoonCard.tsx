"use client";

import { useEffect, useState } from "react";

type OrgWeeklyFocusComingSoonCardProps = {
  userId: string;
  orgName: string;
};

function dismissStorageKey(userId: string) {
  return `org-weekly-focus-empty-dismiss:${userId}`;
}

export default function OrgWeeklyFocusComingSoonCard({
  userId,
  orgName,
}: OrgWeeklyFocusComingSoonCardProps) {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      setHidden(window.localStorage.getItem(dismissStorageKey(userId)) === "1");
    } catch {
      setHidden(false);
    }
  }, [userId]);

  if (hidden) {
    return null;
  }

  function dismiss() {
    try {
      window.localStorage.setItem(dismissStorageKey(userId), "1");
    } catch {
      // ignore
    }
    setHidden(true);
  }

  return (
    <article className="relative rounded-2xl border border-[#52B788]/40 bg-[#22c55e]/5 p-4 sm:p-6">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss weekly focus placeholder"
        className="absolute right-3 top-3 rounded-full border border-[#2b3650] px-2 py-0.5 text-sm text-zinc-400 hover:text-zinc-200"
      >
        x
      </button>
      <p className="pr-8 text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">
        {orgName} focus
      </p>
      <p className="mt-3 text-sm text-zinc-300">
        This week&apos;s focus is coming soon. Check back Monday.
      </p>
    </article>
  );
}
