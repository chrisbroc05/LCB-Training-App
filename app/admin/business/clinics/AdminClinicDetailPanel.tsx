"use client";

import { useEffect, useState } from "react";
import { adminFetchJson } from "@/lib/admin-fetch-shared";

type ClinicDetail = {
  id: string;
  slug: string;
  name: string;
  location: string;
  agesSportsText: string;
  description: string;
  whatToBring: string;
  refundPolicyText: string;
  startTimeLocal: string;
  endTimeLocal: string;
  pricePerDayCents: number;
  allDaysPriceCents: number;
  capacityPerDay: number;
  active: boolean;
  closed: boolean;
  dayDateKeys: string[];
  registrations: Array<{
    id: string;
    status: string;
    needsReview: boolean;
    playerName: string;
    playerAge: number;
    sportLabel: string;
    position: string | null;
    parentName: string;
    parentEmail: string;
    parentPhone: string | null;
    mediaConsent: boolean;
    amountLabel: string;
    dayLabels: string[];
  }>;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-[#2b3650] bg-black px-3 py-2 text-sm text-zinc-100";

export default function AdminClinicDetailPanel({ clinicId }: { clinicId: string }) {
  const [clinic, setClinic] = useState<ClinicDetail | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    location: "",
    agesSportsText: "",
    description: "",
    whatToBring: "",
    refundPolicyText: "",
    startTimeLocal: "",
    endTimeLocal: "",
    pricePerDayCents: "",
    allDaysPriceCents: "",
    capacityPerDay: "",
    daysCsv: "",
    active: true,
    closed: false,
  });

  const load = async () => {
    setError("");
    const res = await adminFetchJson<{ clinic: ClinicDetail }>(
      `/api/admin/clinics/${encodeURIComponent(clinicId)}`,
      { cache: "no-store" },
      { context: "admin-clinic-detail" },
    );
    if (!res.ok) {
      setError(res.userMessage || "Failed to load clinic.");
      return;
    }
    const next = res.data.clinic;
    setClinic(next);
    setForm({
      name: next.name,
      location: next.location,
      agesSportsText: next.agesSportsText,
      description: next.description,
      whatToBring: next.whatToBring,
      refundPolicyText: next.refundPolicyText,
      startTimeLocal: next.startTimeLocal,
      endTimeLocal: next.endTimeLocal,
      pricePerDayCents: String(next.pricePerDayCents),
      allDaysPriceCents: String(next.allDaysPriceCents),
      capacityPerDay: String(next.capacityPerDay),
      daysCsv: next.dayDateKeys.join("\n"),
      active: next.active,
      closed: next.closed,
    });
  };

  useEffect(() => {
    void load();
  }, [clinicId]);

  const onSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    const res = await adminFetchJson<{ clinic: ClinicDetail }>(
      `/api/admin/clinics/${encodeURIComponent(clinicId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          pricePerDayCents: Number(form.pricePerDayCents),
          allDaysPriceCents: Number(form.allDaysPriceCents),
          capacityPerDay: Number(form.capacityPerDay),
          daysCsv: form.daysCsv,
        }),
      },
      { context: "admin-clinic-update" },
    );
    setSaving(false);
    if (!res.ok) {
      setError(res.userMessage || "Could not save clinic.");
      return;
    }
    setClinic(res.data.clinic);
    setMessage("Saved.");
  };

  const markRefunded = async (registrationId: string) => {
    if (!window.confirm("Mark this registration as refunded and free the spots?")) {
      return;
    }
    const res = await adminFetchJson<{ ok: boolean }>(
      `/api/admin/clinics/registrations/${encodeURIComponent(registrationId)}/refund`,
      { method: "POST" },
      { context: "admin-clinic-refund" },
    );
    if (!res.ok) {
      setError(res.userMessage || "Could not mark refunded.");
      return;
    }
    await load();
  };

  if (!clinic && !error) {
    return <p className="text-sm text-zinc-400">Loading clinic...</p>;
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {message ? <p className="text-sm text-[#9df3bd]">{message}</p> : null}

      {clinic ? (
        <p className="text-sm text-zinc-400">
          Public page: /clinics/{clinic.slug}
        </p>
      ) : null}

      <form onSubmit={onSave} className="space-y-3 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4">
        <h2 className="text-base font-semibold text-zinc-100">Edit clinic</h2>
        {(
          [
            ["name", "Name"],
            ["location", "Location"],
            ["agesSportsText", "Ages / sports"],
            ["description", "Description"],
            ["whatToBring", "What to bring"],
            ["refundPolicyText", "Refund policy"],
            ["startTimeLocal", "Start time"],
            ["endTimeLocal", "End time"],
            ["pricePerDayCents", "Price per day (cents)"],
            ["allDaysPriceCents", "All-days price (cents)"],
            ["capacityPerDay", "Capacity per day"],
            ["daysCsv", "Days (YYYY-MM-DD)"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-sm text-zinc-300">
            {label}
            {key === "description" || key === "refundPolicyText" || key === "daysCsv" ? (
              <textarea
                className={inputClass}
                rows={key === "daysCsv" ? 3 : 2}
                value={form[key]}
                onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
              />
            ) : (
              <input
                className={inputClass}
                value={form[key]}
                onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
              />
            )}
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
          />
          Active (visible on /clinics)
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={form.closed}
            onChange={(event) => setForm((current) => ({ ...current, closed: event.target.checked }))}
          />
          Closed for signup
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-zinc-100">Roster</h2>
          <a
            href={`/api/admin/clinics/${encodeURIComponent(clinicId)}/export`}
            className="rounded-full border border-[#2b3650] px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-[#22c55e]/50"
          >
            Download CSV
          </a>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-[#18243a]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#0b1324] text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2">Player</th>
                <th className="px-3 py-2">Parent</th>
                <th className="px-3 py-2">Days</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(clinic?.registrations ?? []).map((reg) => (
                <tr key={reg.id} className="border-t border-[#18243a] text-zinc-300">
                  <td className="px-3 py-2 align-top">
                    <p className="font-medium text-zinc-100">
                      {reg.playerName} ({reg.playerAge})
                    </p>
                    <p className="text-xs text-zinc-500">
                      {reg.sportLabel}
                      {reg.position ? ` | ${reg.position}` : ""}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Media: {reg.mediaConsent ? "yes" : "group only"}
                    </p>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <p>{reg.parentName}</p>
                    <p className="text-xs text-zinc-500">{reg.parentEmail}</p>
                    <p className="text-xs text-zinc-500">{reg.parentPhone || "-"}</p>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <p>{reg.dayLabels.join(", ")}</p>
                    <p className="text-xs text-zinc-500">{reg.amountLabel}</p>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <p>{reg.status}</p>
                    {reg.needsReview ? (
                      <p className="mt-1 text-xs font-semibold text-amber-300">Needs review</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {reg.status === "PAID" ? (
                      <button
                        type="button"
                        onClick={() => void markRefunded(reg.id)}
                        className="text-xs font-semibold text-amber-300 hover:underline"
                      >
                        Mark refunded
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-600">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {(clinic?.registrations.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-zinc-500">
                    No registrations yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
