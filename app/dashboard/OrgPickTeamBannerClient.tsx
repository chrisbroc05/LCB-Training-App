"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ORG_TEAM_NOT_LISTED_LABEL,
  ORG_TEAM_NOT_LISTED_VALUE,
} from "@/lib/org-team-pick-shared";

type OrgPickTeamBannerClientProps = {
  orgName: string;
  teams: Array<{ id: string; name: string }>;
};

export default function OrgPickTeamBannerClient({
  orgName,
  teams,
}: OrgPickTeamBannerClientProps) {
  const router = useRouter();
  const [teamValue, setTeamValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    if (!teamValue) {
      setError("Choose a team, or say your team isn't listed.");
      return;
    }
    setSaving(true);
    try {
      const notListed = teamValue === ORG_TEAM_NOT_LISTED_VALUE;
      const response = await fetch("/api/settings/org-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          notListed
            ? { notListed: true }
            : { orgTeamId: teamValue, notListed: false },
        ),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not save your team.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not save your team.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-2xl border border-[#52B788]/50 bg-[#22c55e]/10 p-4 sm:p-5">
      <p className="text-sm font-semibold text-zinc-100">Which team are you on?</p>
      <p className="mt-2 text-sm text-zinc-300">
        This lets Coach Broc set your team&apos;s weekly focus
        {orgName ? ` for ${orgName}` : ""}.
      </p>
      <label className="mt-4 block text-sm text-zinc-200">
        Team
        <select
          value={teamValue}
          onChange={(event) => setTeamValue(event.target.value)}
          className="mt-1 w-full rounded-xl border border-[#2b3650] bg-[#0A1628]/80 px-4 py-3 text-sm text-zinc-100"
        >
          <option value="">Choose a team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
          <option value={ORG_TEAM_NOT_LISTED_VALUE}>{ORG_TEAM_NOT_LISTED_LABEL}</option>
        </select>
      </label>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
      <button
        type="button"
        disabled={saving}
        onClick={() => void handleSave()}
        className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </article>
  );
}
