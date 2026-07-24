"use client";

import { useEffect, useMemo, useState } from "react";
import MemberProfileCard from "@/app/admin/MemberProfileCard";
import {
  formatAssessmentCallDateTime,
  toAssessmentCallInputValues,
} from "@/lib/assessment-call";
import { formatDatabaseTierLabel, validDatabaseTiers, type DatabaseTier } from "@/lib/membership";

type MemberSummary = {
  id: string;
  name: string | null;
  email: string;
  membershipTier: DatabaseTier;
  signupDate: string;
  lastActiveAt: string | null;
  submissionCount: number;
  assessmentCallBooked: boolean;
  assessmentCallDate: string | null;
  monthlySubmissionsRemaining: number | null;
};

type MemberDetail = MemberSummary & {
  adminNotes: string | null;
  hasStripeSubscription: boolean;
  memberProfile: {
    hasProfile: boolean;
    position: string | null;
    age: number | null;
    graduationYear: number | null;
    currentTeam: string | null;
    level: string | null;
    playerBio: string | null;
  };
  coachingSubmissions: Array<{
    id: string;
    type: "SWING" | "MENTAL";
    title: string;
    subtitle: string;
    createdAt: string;
    status: string;
  }>;
  goalCheckins: Array<{
    id: number;
    monthlyFocus: string;
    createdAt: string;
    status: string;
  }>;
};

type TierFilter = "ALL" | DatabaseTier;

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function TierBadge({ tier }: { tier: DatabaseTier }) {
  const styles: Record<DatabaseTier, string> = {
    FREE: "border-zinc-500/40 bg-zinc-500/15 text-zinc-200",
    BASIC: "border-blue-400/40 bg-blue-500/15 text-blue-100",
    MEMORABLE: "border-[#22c55e]/40 bg-[#22c55e]/15 text-[#9df3bd]",
    ELITE: "border-yellow-400/40 bg-yellow-500/15 text-yellow-100",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${styles[tier]}`}
    >
      {formatDatabaseTierLabel(tier)}
    </span>
  );
}

export default function MembersPanel() {
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<TierFilter>("ALL");
  const [tierDraft, setTierDraft] = useState<DatabaseTier>("FREE");
  const [notesDraft, setNotesDraft] = useState("");
  const [tierError, setTierError] = useState("");
  const [tierSuccess, setTierSuccess] = useState("");
  const [notesError, setNotesError] = useState("");
  const [notesSuccess, setNotesSuccess] = useState("");
  const [isSavingTier, setIsSavingTier] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [callDate, setCallDate] = useState("");
  const [callTime, setCallTime] = useState("");
  const [callError, setCallError] = useState("");
  const [callSuccess, setCallSuccess] = useState("");
  const [isSavingCall, setIsSavingCall] = useState(false);
  const [showCallForm, setShowCallForm] = useState(false);

  useEffect(() => {
    const loadMembers = async () => {
      setLoadingList(true);
      const response = await fetch("/api/admin/members");
      setLoadingList(false);

      if (!response.ok) {
        setMembers([]);
        return;
      }

      const data = (await response.json()) as { members: MemberSummary[] };
      setMembers(data.members);
    };

    void loadMembers();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    const loadDetail = async () => {
      setLoadingDetail(true);
      const response = await fetch(`/api/admin/members/${selectedId}`);
      setLoadingDetail(false);

      if (!response.ok) {
        setDetail(null);
        return;
      }

      const data = (await response.json()) as { member: MemberDetail };
      setDetail(data.member);
      setTierDraft(data.member.membershipTier);
      setNotesDraft(data.member.adminNotes ?? "");
      setTierError("");
      setTierSuccess("");
      setNotesError("");
      setNotesSuccess("");
      setCallError("");
      setCallSuccess("");
      setShowCallForm(false);
      setCallDate("");
      setCallTime("");
    };

    void loadDetail();
  }, [selectedId]);

  const filteredMembers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return members.filter((member) => {
      if (tierFilter !== "ALL" && member.membershipTier !== tierFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const name = member.name?.toLowerCase() ?? "";
      const email = member.email.toLowerCase();
      return name.includes(normalizedQuery) || email.includes(normalizedQuery);
    });
  }, [members, searchQuery, tierFilter]);

  const updateMemberInList = (updatedMember: MemberSummary) => {
    setMembers((current) =>
      current
        .map((member) => (member.id === updatedMember.id ? updatedMember : member))
        .sort(
          (left, right) =>
            new Date(right.signupDate).getTime() - new Date(left.signupDate).getTime(),
        ),
    );
  };

  const handleSaveTier = async () => {
    if (!detail) {
      return;
    }

    setIsSavingTier(true);
    setTierError("");
    setTierSuccess("");

    try {
      const response = await fetch(`/api/admin/members/${detail.id}/tier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipTier: tierDraft }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        member?: MemberDetail;
      };

      if (!response.ok || !data.member) {
        setTierError(data.error ?? "Unable to update membership tier.");
        return;
      }

      setDetail(data.member);
      updateMemberInList(data.member);
      setTierSuccess("Membership tier updated.");
    } catch {
      setTierError("Unable to update membership tier right now.");
    } finally {
      setIsSavingTier(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!detail) {
      return;
    }

    setIsSavingNotes(true);
    setNotesError("");
    setNotesSuccess("");

    try {
      const response = await fetch(`/api/admin/members/${detail.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesDraft }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        member?: MemberDetail;
      };

      if (!response.ok || !data.member) {
        setNotesError(data.error ?? "Unable to save admin notes.");
        return;
      }

      setDetail(data.member);
      setNotesDraft(data.member.adminNotes ?? "");
      setNotesSuccess("Admin notes saved.");
    } catch {
      setNotesError("Unable to save admin notes right now.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleSaveCall = async () => {
    if (!detail) {
      return;
    }

    if (!callDate || !callTime) {
      setCallError("Please select both a date and time.");
      return;
    }

    setIsSavingCall(true);
    setCallError("");
    setCallSuccess("");

    try {
      const response = await fetch("/api/admin/mark-call-booked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: detail.id,
          callDate,
          callTime,
        }),
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
        setCallError(data.error ?? "Unable to save call booking.");
        return;
      }

      const detailResponse = await fetch(`/api/admin/members/${detail.id}`);
      if (detailResponse.ok) {
        const detailData = (await detailResponse.json()) as { member: MemberDetail };
        setDetail(detailData.member);
        updateMemberInList(detailData.member);
      }

      setCallSuccess("Assessment call saved.");
      setShowCallForm(false);
      setCallDate("");
      setCallTime("");
    } catch {
      setCallError("Unable to save call booking right now.");
    } finally {
      setIsSavingCall(false);
    }
  };

  const openCallEditForm = () => {
    if (!detail?.assessmentCallDate) {
      setShowCallForm(true);
      setCallDate("");
      setCallTime("");
      return;
    }

    const inputValues = toAssessmentCallInputValues(new Date(detail.assessmentCallDate));
    setShowCallForm(true);
    setCallDate(inputValues.callDate);
    setCallTime(inputValues.callTime);
  };

  return (
    <div className="mt-6 grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section className="rounded-2xl border border-[#18243a] bg-black/30 p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-200" htmlFor="member-search">
              Search members
            </label>
            <input
              id="member-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name or email"
              className="mt-2 w-full rounded-lg border border-[#2b3650] bg-[#0b1324]/80 px-3 py-2 text-sm text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-200" htmlFor="member-tier-filter">
              Filter by tier
            </label>
            <select
              id="member-tier-filter"
              value={tierFilter}
              onChange={(event) => setTierFilter(event.target.value as TierFilter)}
              className="mt-2 w-full rounded-lg border border-[#2b3650] bg-[#0b1324]/80 px-3 py-2 text-sm text-zinc-100 lg:min-w-[180px]"
            >
              <option value="ALL">All</option>
              {validDatabaseTiers.map((tier) => (
                <option key={tier} value={tier}>
                  {formatDatabaseTierLabel(tier)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {loadingList ? (
            <p className="text-sm text-zinc-400">Loading members...</p>
          ) : filteredMembers.length === 0 ? (
            <p className="text-sm text-zinc-400">No members match your search.</p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#2b3650] text-xs uppercase tracking-wide text-zinc-400">
                  <th className="px-3 py-3 font-semibold">Name</th>
                  <th className="px-3 py-3 font-semibold">Email</th>
                  <th className="px-3 py-3 font-semibold">Tier</th>
                  <th className="px-3 py-3 font-semibold">Member Since</th>
                  <th className="px-3 py-3 font-semibold">Last Active</th>
                  <th className="px-3 py-3 font-semibold">Submissions</th>
                  <th className="px-3 py-3 font-semibold">Call Status</th>
                  <th className="px-3 py-3 font-semibold">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const isSelected = selectedId === member.id;

                  return (
                    <tr
                      key={member.id}
                      onClick={() => setSelectedId(member.id)}
                      className={`cursor-pointer border-b border-[#2b3650]/70 transition ${
                        isSelected
                          ? "bg-[#22c55e]/10"
                          : "hover:bg-[#0b1324]/80"
                      }`}
                    >
                      <td className="px-3 py-3 font-medium text-zinc-100">
                        {member.name?.trim() || "Unnamed member"}
                      </td>
                      <td className="px-3 py-3 text-zinc-300">{member.email}</td>
                      <td className="px-3 py-3">
                        <TierBadge tier={member.membershipTier} />
                      </td>
                      <td className="px-3 py-3 text-zinc-300">{formatDate(member.signupDate)}</td>
                      <td className="px-3 py-3 text-zinc-300">
                        {member.lastActiveAt ? formatDateTime(member.lastActiveAt) : "Not available"}
                      </td>
                      <td className="px-3 py-3 text-zinc-300">{member.submissionCount}</td>
                      <td className="px-3 py-3 text-zinc-300">
                        {member.assessmentCallBooked && member.assessmentCallDate
                          ? "Booked"
                          : "Not Booked"}
                      </td>
                      <td className="px-3 py-3 text-zinc-300">
                        {member.monthlySubmissionsRemaining === null
                          ? "--"
                          : member.monthlySubmissionsRemaining}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <aside className="rounded-2xl border border-[#18243a] bg-black/30 p-4 sm:p-5">
        {!selectedId ? (
          <p className="text-sm text-zinc-400">Select a member to view details.</p>
        ) : loadingDetail ? (
          <p className="text-sm text-zinc-400">Loading member details...</p>
        ) : !detail ? (
          <p className="text-sm text-zinc-400">Unable to load member details.</p>
        ) : (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-zinc-100">
                {detail.name?.trim() || "Unnamed member"}
              </h3>
              <p className="mt-1 text-sm text-zinc-300">{detail.email}</p>
              <div className="mt-3">
                <TierBadge tier={detail.membershipTier} />
              </div>
            </div>

            <div className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4 text-sm text-zinc-300">
              <p>
                <span className="font-semibold text-zinc-100">Member since:</span>{" "}
                {formatDate(detail.signupDate)}
              </p>
              <p className="mt-2">
                <span className="font-semibold text-zinc-100">Last active:</span>{" "}
                {detail.lastActiveAt ? formatDateTime(detail.lastActiveAt) : "Not available"}
              </p>
              <p className="mt-2">
                <span className="font-semibold text-zinc-100">Submission count:</span>{" "}
                {detail.submissionCount}
              </p>
              <p className="mt-2">
                <span className="font-semibold text-zinc-100">Call status:</span>{" "}
                {detail.assessmentCallBooked && detail.assessmentCallDate ? (
                  <>
                    Booked -- {formatAssessmentCallDateTime(new Date(detail.assessmentCallDate))}
                  </>
                ) : (
                  "Not Booked"
                )}
              </p>
              {detail.monthlySubmissionsRemaining !== null ? (
                <p className="mt-2">
                  <span className="font-semibold text-zinc-100">
                    Monthly submissions remaining:
                  </span>{" "}
                  {detail.monthlySubmissionsRemaining}
                </p>
              ) : null}
              {detail.hasStripeSubscription ? (
                <p className="mt-2 text-yellow-100">
                  This member currently has a Stripe subscription on file.
                </p>
              ) : null}
            </div>

            <MemberProfileCard profile={detail.memberProfile} />

            {detail.membershipTier === "FREE" ? (
              <div className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4">
                <p className="text-sm font-semibold text-zinc-100">Assessment Call</p>
                {!showCallForm ? (
                  <button
                    type="button"
                    onClick={openCallEditForm}
                    className="mt-3 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
                  >
                    {detail.assessmentCallBooked ? "Edit Call Booking" : "Mark Call Booked"}
                  </button>
                ) : (
                  <div className="mt-4 space-y-4">
                    <p className="text-xs text-zinc-400">
                      Enter the date and time in Central Time (America/Chicago).
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
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
                    {callError ? <p className="text-sm text-red-300">{callError}</p> : null}
                    {callSuccess ? <p className="text-sm text-[#9df3bd]">{callSuccess}</p> : null}
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleSaveCall}
                        disabled={isSavingCall}
                        className="inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSavingCall ? "Saving..." : "Save Call"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCallForm(false);
                          setCallError("");
                        }}
                        disabled={isSavingCall}
                        className="inline-flex rounded-full border border-[#2b3650] bg-black/40 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-[#7f9434] hover:text-[#98b144] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4">
              <p className="text-sm font-semibold text-zinc-100">Coaching Submissions</p>
              {detail.coachingSubmissions.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-400">No coaching submissions yet.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {detail.coachingSubmissions.map((submission) => (
                    <div
                      key={`${submission.type}-${submission.id}`}
                      className="rounded-lg border border-[#2b3650] bg-black/30 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-zinc-100">{submission.title}</p>
                        <span className="rounded-full bg-[#22c55e]/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#9df3bd]">
                          {submission.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">
                        {submission.type === "SWING" ? "Swing Analysis" : "Mental Game"} --{" "}
                        {submission.subtitle}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {formatDateTime(submission.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4">
              <p className="text-sm font-semibold text-zinc-100">Goal Check-Ins</p>
              {detail.goalCheckins.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-400">No goal check-ins yet.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {detail.goalCheckins.map((checkin) => (
                    <div
                      key={checkin.id}
                      className="rounded-lg border border-[#2b3650] bg-black/30 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-zinc-100">{checkin.monthlyFocus}</p>
                        <span className="rounded-full bg-[#22c55e]/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#9df3bd]">
                          {checkin.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {formatDateTime(checkin.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4">
              <p className="text-sm font-semibold text-zinc-100">Manual Tier Override</p>
              <p className="mt-2 text-xs text-zinc-400">
                Update this member&apos;s tier directly without Stripe checkout. Stripe billing
                fields are cleared when you save.
              </p>
              <label className="mt-4 block text-sm text-zinc-300">
                Membership tier
                <select
                  value={tierDraft}
                  onChange={(event) => setTierDraft(event.target.value as DatabaseTier)}
                  className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-zinc-100"
                >
                  {validDatabaseTiers.map((tier) => (
                    <option key={tier} value={tier}>
                      {formatDatabaseTierLabel(tier)}
                    </option>
                  ))}
                </select>
              </label>
              {tierError ? <p className="mt-3 text-sm text-red-300">{tierError}</p> : null}
              {tierSuccess ? <p className="mt-3 text-sm text-[#9df3bd]">{tierSuccess}</p> : null}
              <button
                type="button"
                onClick={handleSaveTier}
                disabled={isSavingTier}
                className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingTier ? "Saving..." : "Save Tier"}
              </button>
            </div>

            <div className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4">
              <p className="text-sm font-semibold text-zinc-100">Private Coach Notes</p>
              <p className="mt-2 text-xs text-zinc-400">
                These notes are only visible in the admin portal.
              </p>
              <textarea
                value={notesDraft}
                onChange={(event) => setNotesDraft(event.target.value)}
                rows={5}
                placeholder="Add private notes about this member..."
                className="mt-4 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-sm text-zinc-100"
              />
              {notesError ? <p className="mt-3 text-sm text-red-300">{notesError}</p> : null}
              {notesSuccess ? <p className="mt-3 text-sm text-[#9df3bd]">{notesSuccess}</p> : null}
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingNotes ? "Saving..." : "Save Notes"}
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
