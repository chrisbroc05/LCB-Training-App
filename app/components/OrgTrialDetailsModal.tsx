"use client";

import Link from "next/link";
import { useEffect } from "react";
import { getOrgTrialIncludesLine } from "@/lib/org-trial-copy-shared";

type OrgTrialDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  orgName: string;
  endLabel: string | null;
  teamName?: string | null;
};

export default function OrgTrialDetailsModal({
  open,
  onClose,
  orgName,
  endLabel,
  teamName,
}: OrgTrialDetailsModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const includesLine = getOrgTrialIncludesLine();

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#52B788]/40 bg-[#0b1324] p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="org-trial-modal-title"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">
            {orgName} Trial
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#2b3650] px-2.5 py-0.5 text-xs text-zinc-400"
          >
            Close
          </button>
        </div>
        <h2 id="org-trial-modal-title" className="mt-2 text-lg font-semibold text-zinc-100">
          What your trial includes
        </h2>
        <p className="mt-3 text-sm text-zinc-300">{includesLine}</p>
        {endLabel ? (
          <p className="mt-3 text-sm text-zinc-400">Trial ends on {endLabel} (Chicago time).</p>
        ) : null}
        {teamName ? <p className="mt-2 text-xs text-zinc-500">Team: {teamName}</p> : null}
        <Link
          href="/upgrade"
          className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
        >
          Keep going
        </Link>
      </div>
    </div>
  );
}
