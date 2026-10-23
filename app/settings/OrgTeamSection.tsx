"use client";

import { useCallback, useEffect, useState } from "react";
import SettingsCard from "@/app/settings/SettingsCard";
import { settingsBodyTextClass, settingsMutedTextClass } from "@/app/settings/settings-styles";

type OrgTeamPayload = {
  id: string;
  name: string;
  orgTeamId: string | null;
  orgTeamName: string | null;
  orgTeamActive: boolean | null;
  teams: Array<{ id: string; name: string }>;
};

export default function OrgTeamSection() {
  const [organization, setOrganization] = useState<OrgTeamPayload | null>(null);
  const [teamId, setTeamId] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/settings/org-team");
    const data = (await response.json()) as { organization: OrgTeamPayload | null };
    setOrganization(data.organization);
    setTeamId(data.organization?.orgTeamId ?? "");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveTeam(nextTeamId: string) {
    setSaveState("saving");
    setError(null);
    const response = await fetch("/api/settings/org-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgTeamId: nextTeamId || null }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setSaveState("error");
      setError(data.error ?? "Could not save team.");
      return;
    }
    setSaveState("saved");
    await load();
    window.setTimeout(() => setSaveState("idle"), 2000);
  }

  if (!organization) {
    return null;
  }

  const inactiveTeam = organization.orgTeamId && organization.orgTeamActive === false;

  return (
    <SettingsCard title="Organization team" id="org-team">
      <p className={settingsBodyTextClass}>
        {organization.name}
        {organization.orgTeamName ? ` - current team: ${organization.orgTeamName}` : ""}
      </p>
      {inactiveTeam ? (
        <p className="mt-2 text-sm text-amber-200">
          Your previous team is no longer active. Choose a current team for this season.
        </p>
      ) : null}
      {organization.teams.length > 0 ? (
        <label className={`mt-4 block ${settingsMutedTextClass}`}>
          Team
          <select
            value={teamId}
            onChange={(event) => {
              const value = event.target.value;
              setTeamId(value);
              void saveTeam(value);
            }}
            className="mt-2 w-full rounded-xl border border-[#2b3650] bg-[#0A1628]/80 px-4 py-3 text-sm text-zinc-100"
          >
            <option value="">No team selected</option>
            {organization.teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className={`mt-3 ${settingsMutedTextClass}`}>No active teams are listed for your org yet.</p>
      )}
      {saveState === "saved" ? (
        <p className="mt-2 text-xs font-semibold text-[#9df3bd]">Saved</p>
      ) : null}
      {saveState === "error" && error ? (
        <p className="mt-2 text-xs text-red-300">{error}</p>
      ) : null}
    </SettingsCard>
  );
}
