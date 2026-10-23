"use client";

import { useState } from "react";

type OrgMember = {
  id: string;
  email: string;
  name: string;
  orgTeamId: string | null;
  orgTeamName: string | null;
};

type OrgRosterMovePanelProps = {
  organizationId: string;
  teams: Array<{ id: string; name: string; active: boolean }>;
  onMoved: () => void;
};

export default function OrgRosterMovePanel({
  organizationId,
  teams,
  onMoved,
}: OrgRosterMovePanelProps) {
  const [members, setMembers] = useState<OrgMember[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [teamId, setTeamId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadMembers() {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/admin/organizations/${organizationId}/members`);
    const data = (await response.json()) as { members?: OrgMember[]; error?: string };
    if (!response.ok) {
      setError(data.error ?? "Could not load members.");
      setLoading(false);
      return;
    }
    setMembers(data.members ?? []);
    setLoading(false);
  }

  async function moveSelected() {
    if (!selected.length) {
      return;
    }
    setError(null);
    const response = await fetch(`/api/admin/organizations/${organizationId}/members/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userIds: selected,
        orgTeamId: teamId || null,
      }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Could not move members.");
      return;
    }
    setSelected([]);
    onMoved();
    await loadMembers();
  }

  const activeTeams = teams.filter((team) => team.active);

  return (
    <div className="mt-5 border-t border-[#2b3650] pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-200">Roster</p>
        <button
          type="button"
          onClick={() => void loadMembers()}
          className="rounded-full border border-[#2b3650] px-3 py-1 text-xs font-semibold text-zinc-200"
        >
          {loading ? "Loading..." : "Load members"}
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
      {members ? (
        <div className="mt-3 space-y-2">
          {members.map((member) => (
            <label key={member.id} className="flex items-center gap-2 text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={selected.includes(member.id)}
                onChange={(event) => {
                  setSelected((current) =>
                    event.target.checked
                      ? [...current, member.id]
                      : current.filter((id) => id !== member.id),
                  );
                }}
              />
              <span>
                {member.name} ({member.orgTeamName ?? "no team"})
              </span>
            </label>
          ))}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <select
              value={teamId}
              onChange={(event) => setTeamId(event.target.value)}
              className="rounded-lg border border-[#2b3650] bg-black px-3 py-2 text-xs text-zinc-100"
            >
              <option value="">Move to no team</option>
              {activeTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void moveSelected()}
              className="rounded-full bg-[#22c55e] px-3 py-1.5 text-xs font-semibold text-black"
            >
              Move to team
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
