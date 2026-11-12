"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminFetchJson } from "@/lib/admin-fetch-shared";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";
import { CLINIC_DEFAULT_REFUND_POLICY } from "@/lib/clinics-shared";

type ClinicListRow = {
  id: string;
  slug: string;
  name: string;
  location: string;
  active: boolean;
  closed: boolean;
  pricePerDayLabel: string;
  allDaysPriceLabel: string;
  capacityPerDay: number;
  registrationCount: number;
  dayLabels: string[];
  availability: Array<{ dateLabel: string; spotsLeft: number; soldOut: boolean }>;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-[#2b3650] bg-black px-3 py-2 text-sm text-zinc-100";

export default function AdminClinicsPanel() {
  const [clinics, setClinics] = useState<ClinicListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    name: "",
    location: "",
    agesSportsText: "All ages, baseball and softball",
    description: "",
    whatToBring: "Glove, water, athletic shoes.",
    refundPolicyText: CLINIC_DEFAULT_REFUND_POLICY,
    startTimeLocal: "10:30",
    endTimeLocal: "12:00",
    pricePerDayCents: "2500",
    allDaysPriceCents: "6500",
    capacityPerDay: "20",
    daysCsv: "",
  });

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await adminFetchJson<{ clinics: ClinicListRow[] }>(
      "/api/admin/clinics",
      { cache: "no-store" },
      { context: "admin-clinics-list" },
    );
    setLoading(false);
    if (!res.ok) {
      setError(res.userMessage || "Failed to load clinics.");
      return;
    }
    setClinics(res.data.clinics);
  };

  useEffect(() => {
    void load();
  }, []);

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setFormError("");
    const res = await adminFetchJson<{ clinic: { id: string } }>(
      "/api/admin/clinics",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          pricePerDayCents: Number(form.pricePerDayCents),
          allDaysPriceCents: Number(form.allDaysPriceCents),
          capacityPerDay: Number(form.capacityPerDay),
          daysCsv: form.daysCsv,
        }),
      },
      { context: "admin-clinics-create" },
    );
    setCreating(false);
    if (!res.ok) {
      setFormError(res.userMessage || "Could not create clinic.");
      return;
    }
    window.location.href = ADMIN_ROUTES.business.clinicDetail(res.data.clinic.id);
  };

  return (
    <div className="space-y-8">
      {loading ? <p className="text-sm text-zinc-400">Loading clinics...</p> : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <ul className="space-y-3">
        {clinics.map((clinic) => (
          <li
            key={clinic.id}
            className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 px-4 py-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link
                  href={ADMIN_ROUTES.business.clinicDetail(clinic.id)}
                  className="text-lg font-semibold text-[#9df3bd] hover:underline"
                >
                  {clinic.name}
                </Link>
                <p className="mt-1 text-sm text-zinc-400">
                  {clinic.location} | /clinics/{clinic.slug}
                </p>
                <p className="mt-1 text-sm text-zinc-300">{clinic.dayLabels.join(" | ")}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {clinic.pricePerDayLabel}/day | all days {clinic.allDaysPriceLabel} | cap{" "}
                  {clinic.capacityPerDay} | {clinic.registrationCount} registrations
                </p>
                <p className="mt-2 text-xs text-zinc-400">
                  {clinic.availability
                    .map((day) =>
                      day.soldOut
                        ? `${day.dateLabel}: sold out`
                        : `${day.dateLabel}: ${day.spotsLeft} left`,
                    )
                    .join(" | ")}
                </p>
              </div>
              <div className="text-right text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <p>{clinic.active ? "Active" : "Inactive"}</p>
                <p>{clinic.closed ? "Closed" : "Open"}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <form
        onSubmit={onCreate}
        className="space-y-3 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4"
      >
        <h2 className="text-base font-semibold text-zinc-100">Create clinic</h2>
        <p className="text-xs text-zinc-500">
          Days: comma or newline separated YYYY-MM-DD (Chicago calendar dates).
        </p>
        {(
          [
            ["name", "Name"],
            ["location", "Location"],
            ["agesSportsText", "Ages / sports"],
            ["description", "Description"],
            ["whatToBring", "What to bring"],
            ["refundPolicyText", "Refund policy"],
            ["startTimeLocal", "Start time (e.g. 10:30)"],
            ["endTimeLocal", "End time (e.g. 12:00)"],
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
                required={key !== "refundPolicyText"}
              />
            ) : (
              <input
                className={inputClass}
                value={form[key]}
                onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                required
              />
            )}
          </label>
        ))}
        {formError ? <p className="text-sm text-red-400">{formError}</p> : null}
        <button
          type="submit"
          disabled={creating}
          className="rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black disabled:opacity-70"
        >
          {creating ? "Creating..." : "Create clinic"}
        </button>
      </form>
    </div>
  );
}
