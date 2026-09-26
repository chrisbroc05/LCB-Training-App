"use client";

import { useEffect, useState } from "react";

type TwelveWeekEnrollmentRecord = {
  id: string;
  name: string | null;
  email: string;
  statusLabel: string;
  startDate: string | null;
  currentWeek: number;
  phase: string;
  ageGroupLabel: string | null;
  position: string | null;
  focusAreaLabels: string[];
  equipmentLabels: string[];
  seasonModeLabel: string | null;
  knownFor: string | null;
  setupComplete: boolean;
};

export default function TwelveWeekPlayersSection() {
  const [enrollments, setEnrollments] = useState<TwelveWeekEnrollmentRecord[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [grantLoading, setGrantLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadEnrollments = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/program-enrollments");
      const data = (await response.json().catch(() => ({}))) as {
        enrollments?: TwelveWeekEnrollmentRecord[];
        error?: string;
      };

      if (!response.ok || !data.enrollments) {
        throw new Error(data.error ?? "Unable to load 12-week players.");
      }

      setEnrollments(data.enrollments);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load 12-week players.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEnrollments();
  }, []);

  const handleGrantAccess = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGrantLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/grant-program-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        user?: { email: string };
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to grant program access.");
      }

      setSuccess(`Program access granted to ${data.user?.email ?? email}.`);
      setEmail("");
      await loadEnrollments();
    } catch (grantError) {
      setError(grantError instanceof Error ? grantError.message : "Unable to grant program access.");
    } finally {
      setGrantLoading(false);
    }
  };

  return (
    <section className="mt-8 rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100">12-Week Players</h2>
          <p className="mt-2 text-zinc-300">
            Track program setup, start dates, and player answers for the 12-Week Program.
          </p>
        </div>
        <form onSubmit={handleGrantAccess} className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-xl">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="player@email.com"
            className="w-full rounded-xl border border-[#2b3650] bg-black px-4 py-3 text-zinc-100"
            required
          />
          <button
            type="submit"
            disabled={grantLoading}
            className="rounded-xl bg-[#2D6A4F] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
          >
            {grantLoading ? "Granting..." : "Grant program access"}
          </button>
        </form>
      </div>

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-[#9df3bd]">{success}</p> : null}

      {loading ? (
        <p className="mt-6 text-sm text-zinc-400">Loading 12-week players...</p>
      ) : enrollments.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-400">No 12-week program enrollments yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {enrollments.map((enrollment) => (
            <article
              key={enrollment.id}
              className="rounded-2xl border border-[#2b3650] bg-black/30 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-zinc-100">
                    {enrollment.name ?? "Unnamed player"}
                  </p>
                  <p className="text-sm text-zinc-400">{enrollment.email}</p>
                </div>
                <span className="rounded-full border border-[#52B788]/40 bg-[#52B788]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">
                  {enrollment.statusLabel}
                </span>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-zinc-500">Start date</dt>
                  <dd className="text-zinc-100">{enrollment.startDate ?? "Not set"}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Current week / phase</dt>
                  <dd className="text-zinc-100">
                    {enrollment.setupComplete
                      ? `Week ${enrollment.currentWeek || 0} / ${enrollment.phase}`
                      : "Setup incomplete"}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Setup complete</dt>
                  <dd className="text-zinc-100">{enrollment.setupComplete ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Age group</dt>
                  <dd className="text-zinc-100">{enrollment.ageGroupLabel ?? "Not set"}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Position</dt>
                  <dd className="text-zinc-100">{enrollment.position ?? "Not set"}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Season mode</dt>
                  <dd className="text-zinc-100">{enrollment.seasonModeLabel ?? "Not set"}</dd>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <dt className="text-zinc-500">Focus areas</dt>
                  <dd className="text-zinc-100">
                    {enrollment.focusAreaLabels.length > 0
                      ? enrollment.focusAreaLabels.join(", ")
                      : "Not set"}
                  </dd>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <dt className="text-zinc-500">Equipment</dt>
                  <dd className="text-zinc-100">
                    {enrollment.equipmentLabels.length > 0
                      ? enrollment.equipmentLabels.join(", ")
                      : "Not set"}
                  </dd>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <dt className="text-zinc-500">Known for</dt>
                  <dd className="text-zinc-100">{enrollment.knownFor ?? "Not set"}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
