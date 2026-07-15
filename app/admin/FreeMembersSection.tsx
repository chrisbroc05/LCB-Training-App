"use client";

import { useState } from "react";
import { formatAssessmentCallDateTime } from "@/lib/assessment-call";

export type FreeMemberRecord = {
  id: string;
  name: string | null;
  email: string;
  signupDate: string;
  assessmentCallBooked: boolean;
  assessmentCallDate: string | null;
};

function formatSignupDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function FreeMembersSection({
  initialMembers,
}: {
  initialMembers: FreeMemberRecord[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [callDate, setCallDate] = useState("");
  const [callTime, setCallTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleOpenForm = (userId: string) => {
    setActiveUserId(userId);
    setCallDate("");
    setCallTime("");
    setError("");
  };

  const handleCancel = () => {
    setActiveUserId(null);
    setCallDate("");
    setCallTime("");
    setError("");
  };

  const handleSave = async (userId: string) => {
    if (!callDate || !callTime) {
      setError("Please select both a date and time.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/admin/mark-call-booked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, callDate, callTime }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        user?: {
          id: string;
          assessmentCallBooked: boolean;
          assessmentCallDate: string | null;
        };
      };

      if (!response.ok || !data.user) {
        setError(data.error ?? "Unable to save call booking.");
        return;
      }

      setMembers((current) =>
        current.map((member) =>
          member.id === userId
            ? {
                ...member,
                assessmentCallBooked: data.user!.assessmentCallBooked,
                assessmentCallDate: data.user!.assessmentCallDate,
              }
            : member,
        ),
      );
      handleCancel();
    } catch {
      setError("Unable to save call booking right now.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
      <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">Free Members</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Track free tier signups and mark Player Assessment Calls as booked.
      </p>

      {members.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-400">No free tier members yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {members.map((member) => {
            const isFormOpen = activeUserId === member.id;

            return (
              <article
                key={member.id}
                className="rounded-xl border border-[#2b3650] bg-black/30 p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-zinc-100">
                      {member.name?.trim() || "Unnamed member"}
                    </p>
                    <p className="mt-1 text-sm text-zinc-300">{member.email}</p>
                    <p className="mt-2 text-sm text-zinc-400">
                      Signed up: {formatSignupDate(member.signupDate)}
                    </p>
                    <p className="mt-2 text-sm text-zinc-300">
                      Call status:{" "}
                      {member.assessmentCallBooked && member.assessmentCallDate ? (
                        <span className="font-medium text-[#9df3bd]">
                          Call Scheduled --{" "}
                          {formatAssessmentCallDateTime(new Date(member.assessmentCallDate))}
                        </span>
                      ) : (
                        <span className="font-medium text-zinc-200">Not Booked</span>
                      )}
                    </p>
                  </div>

                  {!member.assessmentCallBooked && !isFormOpen ? (
                    <button
                      type="button"
                      onClick={() => handleOpenForm(member.id)}
                      className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
                    >
                      Mark Call Booked
                    </button>
                  ) : null}
                </div>

                {isFormOpen ? (
                  <div className="mt-4 rounded-xl border border-[#2b3650] bg-[#0A1628] p-4">
                    <p className="text-sm font-medium text-zinc-200">Schedule assessment call</p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm text-zinc-300">
                        Call date
                        <input
                          type="date"
                          value={callDate}
                          onChange={(event) => setCallDate(event.target.value)}
                          className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-zinc-100"
                        />
                      </label>
                      <label className="block text-sm text-zinc-300">
                        Call time
                        <input
                          type="time"
                          value={callTime}
                          onChange={(event) => setCallTime(event.target.value)}
                          className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-zinc-100"
                        />
                      </label>
                    </div>
                    {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleSave(member.id)}
                        disabled={isSaving}
                        className="inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="inline-flex rounded-full border border-[#2b3650] bg-black/40 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-[#7f9434] hover:text-[#98b144] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
