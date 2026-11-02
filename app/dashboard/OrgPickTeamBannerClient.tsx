"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type OrgPickTeamBannerClientProps = {
  userId: string;
  orgName: string;
};

function dismissStorageKey(userId: string) {
  return `org-pick-team-dismiss:${userId}`;
}

export default function OrgPickTeamBannerClient({
  userId,
  orgName,
}: OrgPickTeamBannerClientProps) {
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
    <article className="relative rounded-2xl border border-[#2b3650] bg-[#0b1324]/80 p-4 sm:p-5">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss pick your team reminder"
        className="absolute right-3 top-3 rounded-full border border-[#2b3650] px-2 py-0.5 text-sm text-zinc-400 hover:text-zinc-200"
      >
        x
      </button>
      <p className="pr-8 text-sm font-semibold text-zinc-100">Pick your team</p>
      <p className="mt-2 text-sm text-zinc-400">
        {orgName} has teams. Choose yours so weekly focus and roster features match your group. You
        can also set this later in Settings.
      </p>
      <Link
        href="/settings"
        className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black"
      >
        Choose team in Settings
      </Link>
    </article>
  );
}
