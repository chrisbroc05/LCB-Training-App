"use client";

import { useState } from "react";
import {
  formatOrgTrialCountdownLabel,
  ORG_TRIAL_WHATS_NEXT_LINE,
  type OrgTrialDashboardCardMode,
} from "@/lib/org-trial-dashboard-shared";

type OrgTrialDashboardCardClientProps = {
  orgName: string;
  includesLine: string;
  endLabel: string | null;
  trialEndsAtIso: string | null;
  teamName: string | null;
  mode: OrgTrialDashboardCardMode;
  allowDismiss: boolean;
};

export default function OrgTrialDashboardCardClient({
  orgName,
  includesLine,
  endLabel,
  trialEndsAtIso,
  teamName,
  mode,
  allowDismiss,
}: OrgTrialDashboardCardClientProps) {
  const [hidden, setHidden] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  if (hidden) {
    return null;
  }

  async function dismissCard() {
    setDismissing(true);
    try {
      const response = await fetch("/api/settings/org-trial-dashboard-dismiss", {
        method: "POST",
      });
      if (response.ok) {
        setHidden(true);
      }
    } finally {
      setDismissing(false);
    }
  }

  const countdownLabel =
    mode === "countdown" && trialEndsAtIso
      ? formatOrgTrialCountdownLabel(trialEndsAtIso)
      : null;

  return (
    <article className="relative rounded-2xl border border-[#52B788]/40 bg-[#22c55e]/5 p-4 sm:p-6">
      {allowDismiss ? (
        <button
          type="button"
          onClick={() => void dismissCard()}
          disabled={dismissing}
          aria-label="Dismiss trial info card"
          className="absolute right-3 top-3 rounded-full border border-[#2b3650] px-2 py-0.5 text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
        >
          x
        </button>
      ) : null}

      <p className="text-xs font-semibold uppercase tracking-wide text-[#9df3bd] pr-8">
        {orgName} Trial
      </p>

      {mode === "countdown" && countdownLabel ? (
        <>
          <h2 className="mt-2 text-lg font-semibold text-zinc-100">{countdownLabel}</h2>
          <p className="mt-3 text-sm font-medium text-zinc-200">What happens next</p>
          <p className="mt-1 text-sm text-zinc-300">{ORG_TRIAL_WHATS_NEXT_LINE}</p>
          <p className="mt-3 text-sm text-zinc-400">{includesLine}</p>
        </>
      ) : (
        <>
          <h2 className="mt-2 text-lg font-semibold text-zinc-100">What your trial includes</h2>
          <p className="mt-2 text-sm text-zinc-300">{includesLine}</p>
        </>
      )}

      {endLabel ? (
        <p className="mt-3 text-sm text-zinc-400">Trial ends on {endLabel} (Chicago time).</p>
      ) : null}
      {teamName ? <p className="mt-2 text-xs text-zinc-500">Team: {teamName}</p> : null}
    </article>
  );
}
