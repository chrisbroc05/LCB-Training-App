"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  buildAdminOrgCommissionsHref,
  buildOrgFoundingOfferExplainer,
  formatAdminCommissionRate,
  isOrgCommissionConfigured,
  type AdminOrganizationRecord,
} from "@/lib/admin-organizations-shared";
import OrgRosterMovePanel from "@/app/admin/organizations/OrgRosterMovePanel";
import OrgWeeklyFocusAdminPanel from "@/app/admin/organizations/OrgWeeklyFocusAdminPanel";
import {
  formatChicagoDateInputValue,
  formatOrgBillingModeLabel,
  formatOrgCoveredLevelLabel,
} from "@/lib/org-shared";

export default function AdminOrganizationsPanel() {
  const [organizations, setOrganizations] = useState<AdminOrganizationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [saveNotes, setSaveNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/organizations");
      const data = (await response.json()) as {
        organizations?: AdminOrganizationRecord[];
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Could not load organizations.");
        return;
      }
      setOrganizations(data.organizations ?? []);
    } catch {
      setError("Could not load organizations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createOrganization() {
    const name = newName.trim();
    if (!name) {
      return;
    }
    const response = await fetch("/api/admin/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Could not create organization.");
      return;
    }
    setNewName("");
    await load();
  }

  async function patchOrganization(id: string, body: Record<string, unknown>) {
    setSaveNotes((current) => ({ ...current, [id]: "Saving..." }));
    const response = await fetch(`/api/admin/organizations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      const message = data.error ?? "Could not save organization.";
      setSaveNotes((current) => ({ ...current, [id]: message }));
      setError(message);
      return;
    }
    setSaveNotes((current) => ({ ...current, [id]: "Saved" }));
    await load();
  }

  async function deactivateTeam(orgId: string, teamId: string, teamName: string) {
    const response = await fetch(`/api/admin/organizations/${orgId}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: teamId, name: teamName, active: false }),
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Could not deactivate team.");
      return;
    }
    await load();
  }

  async function addCode(orgId: string, code: string) {
    const response = await fetch(`/api/admin/organizations/${orgId}/codes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Could not save code.");
      return;
    }
    await load();
  }

  async function addTeam(orgId: string, name: string) {
    const response = await fetch(`/api/admin/organizations/${orgId}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Could not save team.");
      return;
    }
    await load();
  }

  if (loading) {
    return <p className="text-sm text-zinc-400">Loading organizations...</p>;
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="New organization name"
          className="min-w-[220px] flex-1 rounded-xl border border-[#2b3650] bg-black px-4 py-2 text-sm text-zinc-100"
        />
        <button
          type="button"
          onClick={() => void createOrganization()}
          className="rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black"
        >
          Add organization
        </button>
      </div>

      {organizations.map((org) => (
        <article
          key={org.id}
          className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-zinc-100">{org.name}</h3>
              <p className="mt-1 text-xs text-zinc-500">
                {org.memberCount} members . Join link: /join/{org.codes[0]?.code ?? "..."}
              </p>
            </div>
            <a
              href={`/api/admin/organizations/${org.id}/roster`}
              className="rounded-full border border-[#2b3650] px-3 py-1.5 text-xs font-semibold text-zinc-200"
            >
              Download roster CSV
            </a>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-zinc-400">
              Billing mode
              <select
                value={org.billingMode}
                onChange={(event) =>
                  void patchOrganization(org.id, { billingMode: event.target.value })
                }
                className="mt-1 w-full rounded-lg border border-[#2b3650] bg-black px-3 py-2 text-sm text-zinc-100"
              >
                <option value="FAMILY_PAY">Family pay</option>
                <option value="CLUB_PAY">Club pay</option>
              </select>
            </label>
            <label className="text-xs text-zinc-400">
              Club covered level
              <select
                value={org.coveredLevel ?? ""}
                onChange={(event) =>
                  void patchOrganization(org.id, {
                    coveredLevel: event.target.value || null,
                  })
                }
                className="mt-1 w-full rounded-lg border border-[#2b3650] bg-black px-3 py-2 text-sm text-zinc-100"
              >
                <option value="">None</option>
                <option value="CORE">Core</option>
                <option value="PLUS">Plus</option>
                <option value="ALL_ACCESS">All-Access</option>
              </select>
            </label>
            <label className="text-xs text-zinc-400">
              Trial starts (Chicago date)
              <input
                type="date"
                defaultValue={formatChicagoDateInputValue(org.trialStartsAt)}
                onBlur={(event) =>
                  void patchOrganization(org.id, {
                    trialStartsAt: event.target.value || null,
                  })
                }
                className="mt-1 w-full rounded-lg border border-[#2b3650] bg-black px-3 py-2 text-sm text-zinc-100"
              />
            </label>
            <label className="text-xs text-zinc-400">
              Trial ends (Chicago date)
              <input
                type="date"
                defaultValue={formatChicagoDateInputValue(org.trialEndsAt)}
                onBlur={(event) =>
                  void patchOrganization(org.id, {
                    trialEndsAt: event.target.value || null,
                  })
                }
                className="mt-1 w-full rounded-lg border border-[#2b3650] bg-black px-3 py-2 text-sm text-zinc-100"
              />
            </label>
            <label className="text-xs text-zinc-400 sm:col-span-2">
              Trial locked drill copy
              <textarea
                rows={2}
                defaultValue={org.trialLockedCopy ?? ""}
                onBlur={(event) =>
                  void patchOrganization(org.id, {
                    trialLockedCopy: event.target.value.trim() || null,
                  })
                }
                className="mt-1 w-full rounded-lg border border-[#2b3650] bg-black px-3 py-2 text-sm text-zinc-100"
              />
            </label>
          </div>

          <div className="mt-5 rounded-xl border border-[#2b3650] bg-black/20 p-4">
            <p className="text-sm font-semibold text-zinc-100">Founding offer</p>
            <p className="mt-1 text-xs text-zinc-400">
              {buildOrgFoundingOfferExplainer(org.foundingOfferMonths)}
            </p>
            <label className="mt-3 flex items-center gap-2 text-sm text-zinc-200">
              <input
                type="checkbox"
                checked={org.foundingOfferEnabled}
                onChange={(event) =>
                  void patchOrganization(org.id, {
                    foundingOfferEnabled: event.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-[#2b3650]"
              />
              Founding offer enabled
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-zinc-400">
                Deadline (Chicago date, inclusive)
                <input
                  type="date"
                  defaultValue={formatChicagoDateInputValue(org.foundingOfferDeadline)}
                  onBlur={(event) =>
                    void patchOrganization(org.id, {
                      foundingOfferDeadline: event.target.value || null,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-[#2b3650] bg-black px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="text-xs text-zinc-400">
                Founding months
                <input
                  type="number"
                  min={1}
                  defaultValue={org.foundingOfferMonths}
                  onBlur={(event) =>
                    void patchOrganization(org.id, {
                      foundingOfferMonths: Number(event.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-[#2b3650] bg-black px-3 py-2 text-sm text-zinc-100"
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Founding members: {org.foundingMemberCount}
            </p>
          </div>

          <div className="mt-5 rounded-xl border border-[#2b3650] bg-black/20 p-4">
            <p className="text-sm font-semibold text-zinc-100">Commission</p>
            {isOrgCommissionConfigured(org.commissionRate) ? (
              <>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-xs text-zinc-400">
                    Commission rate (first period, 0-1)
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      defaultValue={org.commissionRate}
                      onBlur={(event) =>
                        void patchOrganization(org.id, {
                          commissionRate: Number(event.target.value),
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-[#2b3650] bg-black px-3 py-2 text-sm text-zinc-100"
                    />
                  </label>
                  <label className="text-xs text-zinc-400">
                    Commission months (first period)
                    <input
                      type="number"
                      min="0"
                      defaultValue={org.commissionMonths}
                      onBlur={(event) =>
                        void patchOrganization(org.id, {
                          commissionMonths: Number(event.target.value),
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-[#2b3650] bg-black px-3 py-2 text-sm text-zinc-100"
                    />
                  </label>
                  <label className="text-xs text-zinc-400">
                    Ongoing commission rate (0-1)
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      defaultValue={org.ongoingCommissionRate}
                      onBlur={(event) =>
                        void patchOrganization(org.id, {
                          ongoingCommissionRate: Number(event.target.value),
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-[#2b3650] bg-black px-3 py-2 text-sm text-zinc-100"
                    />
                  </label>
                  <label className="text-xs text-zinc-400">
                    Commission ends (Chicago date, optional)
                    <input
                      type="date"
                      defaultValue={formatChicagoDateInputValue(org.commissionEndsAt)}
                      onBlur={(event) =>
                        void patchOrganization(org.id, {
                          commissionEndsAt: event.target.value || null,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-[#2b3650] bg-black px-3 py-2 text-sm text-zinc-100"
                    />
                  </label>
                </div>
                <p className="mt-3 text-xs text-zinc-400">
                  First period {formatAdminCommissionRate(org.commissionRate)} for{" "}
                  {org.commissionMonths} months, then{" "}
                  {formatAdminCommissionRate(org.ongoingCommissionRate)} ongoing
                  {org.commissionEndsAt
                    ? ` until ${formatChicagoDateInputValue(org.commissionEndsAt)}`
                    : ""}
                  .
                </p>
                <p className="mt-2 text-xs text-zinc-400">
                  Commissionable families: {org.commissionableFamilies} | Not commissionable:{" "}
                  {org.notCommissionableFamilies}
                </p>
                <p className="mt-2 text-xs">
                  <Link href={buildAdminOrgCommissionsHref(org.id)} className="text-[#52B788] underline">
                    Business &gt; Commissions for this org
                  </Link>
                </p>
              </>
            ) : (
              <div className="mt-2 space-y-3">
                <p className="text-sm text-zinc-400">No commission</p>
                <label className="text-xs text-zinc-400">
                  Commission rate (set above 0 to enable)
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    defaultValue={org.commissionRate}
                    onBlur={(event) =>
                      void patchOrganization(org.id, {
                        commissionRate: Number(event.target.value),
                      })
                    }
                    className="mt-1 w-full max-w-[200px] rounded-lg border border-[#2b3650] bg-black px-3 py-2 text-sm text-zinc-100"
                  />
                </label>
              </div>
            )}
          </div>

          {(org.trialStartsAt && !org.trialEndsAt) || (!org.trialStartsAt && org.trialEndsAt) ? (
            <p className="mt-2 text-xs text-amber-200">
              Set both trial start and end dates (Chicago) for the trial window to apply.
            </p>
          ) : null}
          {saveNotes[org.id] ? (
            <p
              className={`mt-2 text-xs ${
                saveNotes[org.id] === "Saved" ? "text-[#9df3bd]" : "text-zinc-400"
              }`}
            >
              {saveNotes[org.id]}
            </p>
          ) : null}

          <p className="mt-3 text-xs text-zinc-500">
            {formatOrgBillingModeLabel(org.billingMode)}
            {org.billingMode === "CLUB_PAY"
              ? ` . Covers ${formatOrgCoveredLevelLabel(org.coveredLevel)}`
              : ""}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {org.codes.map((code) => (
              <span
                key={code.id}
                className="rounded-full border border-[#2b3650] px-2.5 py-1 text-xs text-zinc-200"
              >
                {code.code}
                {!code.active ? " (inactive)" : ""}
              </span>
            ))}
            <button
              type="button"
              onClick={() => {
                const next = window.prompt("New join code (letters/numbers):");
                if (next) {
                  void addCode(org.id, next);
                }
              }}
              className="rounded-full border border-dashed border-[#52B788]/50 px-2.5 py-1 text-xs text-[#52B788]"
            >
              Add code
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {org.teams.map((team) => (
              <span
                key={team.id}
                className="inline-flex items-center gap-2 rounded-full bg-[#24314a] px-2.5 py-1 text-xs text-zinc-200"
              >
                {team.name} ({team.memberCount})
                {!team.active ? " - inactive" : null}
                {team.active ? (
                  <button
                    type="button"
                    onClick={() => void deactivateTeam(org.id, team.id, team.name)}
                    className="text-[10px] uppercase tracking-wide text-amber-200"
                  >
                    Deactivate
                  </button>
                ) : null}
              </span>
            ))}
            <button
              type="button"
              onClick={() => {
                const next = window.prompt("Team name:");
                if (next) {
                  void addTeam(org.id, next);
                }
              }}
              className="rounded-full border border-dashed border-[#52B788]/50 px-2.5 py-1 text-xs text-[#52B788]"
            >
              Add team
            </button>
          </div>

          <OrgRosterMovePanel organizationId={org.id} teams={org.teams} onMoved={() => void load()} />

          <OrgWeeklyFocusAdminPanel organizationId={org.id} teams={org.teams} />
        </article>
      ))}
    </div>
  );
}
