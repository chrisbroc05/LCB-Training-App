"use client";

import { useEffect, useState } from "react";
import {
  adminFetchJson,
  ADMIN_FETCH_COULD_NOT_LOAD_JSON,
} from "@/lib/admin-fetch-shared";
import {
  DAILY_CHALLENGE_AGE_GROUPS,
  dailyChallengeAgeGroupLabel,
  type DailyChallengeAgeGroupKey,
} from "@/lib/daily-challenge-shared";

type AnswerRow = {
  id: string;
  chicagoDate: string;
  ageGroup: DailyChallengeAgeGroupKey;
  mindsetAnswer: string | null;
  prompt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    organizationName: string | null;
    teamName: string | null;
  };
};

type OrgOption = { id: string; name: string; teams: Array<{ id: string; name: string }> };

export default function AdminDailyChallengeAnswersPanel() {
  const [date, setDate] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [orgTeamId, setOrgTeamId] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const loadOrgs = async () => {
      const res = await adminFetchJson<{
        organizations?: Array<{
          id: string;
          name: string;
          teams: Array<{ id: string; name: string }>;
        }>;
      }>("/api/admin/organizations", { cache: "no-store" }, {
        context: "daily-challenge-answers-orgs",
      });
      if (res.ok) {
        setOrgs(
          (res.data.organizations ?? []).map((org) => ({
            id: org.id,
            name: org.name,
            teams: org.teams ?? [],
          })),
        );
      }
    };
    void loadOrgs();
  }, []);

  const selectedOrg = orgs.find((org) => org.id === organizationId) ?? null;

  const loadAnswers = async () => {
    if (!date) {
      setError("Pick a date.");
      return;
    }
    setBusy(true);
    setError(null);
    const params = new URLSearchParams({ date });
    if (organizationId) {
      params.set("organizationId", organizationId);
    }
    if (orgTeamId) {
      params.set("orgTeamId", orgTeamId);
    }
    if (ageGroup) {
      params.set("ageGroup", ageGroup);
    }
    const res = await adminFetchJson<{ answers?: AnswerRow[]; error?: string }>(
      `/api/admin/daily-challenges/answers?${params.toString()}`,
      { cache: "no-store" },
      {
        context: "daily-challenge-answers",
        okUserMessage: "Couldn't load answers.",
        notJsonUserMessage: ADMIN_FETCH_COULD_NOT_LOAD_JSON,
      },
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.userMessage);
      return;
    }
    setAnswers(res.data.answers ?? []);
  };

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm text-zinc-300">
            Date
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-1 block rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-zinc-300">
            Organization
            <select
              value={organizationId}
              onChange={(event) => {
                setOrganizationId(event.target.value);
                setOrgTeamId("");
              }}
              className="mt-1 block rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-zinc-300">
            Team
            <select
              value={orgTeamId}
              onChange={(event) => setOrgTeamId(event.target.value)}
              className="mt-1 block rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2 text-sm"
              disabled={!selectedOrg}
            >
              <option value="">All</option>
              {(selectedOrg?.teams ?? []).map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-zinc-300">
            Age group
            <select
              value={ageGroup}
              onChange={(event) => setAgeGroup(event.target.value)}
              className="mt-1 block rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {DAILY_CHALLENGE_AGE_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {dailyChallengeAgeGroupLabel(group)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => void loadAnswers()}
            className="rounded-full bg-[#52B788] px-4 py-2 text-sm font-semibold text-[#0A1628]"
          >
            Load
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">
          Answers ({answers.length})
        </h2>
        <div className="mt-4 space-y-3">
          {answers.map((row) => (
            <article key={row.id} className="rounded-xl border border-[#1c2740] p-4 text-sm">
              <p className="font-semibold text-zinc-100">{row.user.name}</p>
              <p className="text-xs text-zinc-500">
                {row.user.organizationName ?? "No org"}
                {row.user.teamName ? ` - ${row.user.teamName}` : ""} -{" "}
                {dailyChallengeAgeGroupLabel(row.ageGroup)}
              </p>
              {row.prompt ? <p className="mt-2 text-zinc-400">{row.prompt}</p> : null}
              <p className="mt-2 whitespace-pre-wrap text-zinc-200">{row.mindsetAnswer}</p>
            </article>
          ))}
          {answers.length === 0 ? (
            <p className="text-sm text-zinc-400">No mindset answers for these filters.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
