"use client";

import { useEffect, useMemo, useState } from "react";
import MemberDetailContent, { type MemberDetail } from "@/app/admin/MemberDetailContent";
import TierBadge from "@/app/admin/TierBadge";
import MobileBottomSheet from "@/app/components/mobile/MobileBottomSheet";
import { useIsMobile } from "@/app/components/mobile/useIsMobile";
import { toAssessmentCallInputValues } from "@/lib/assessment-call";
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

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
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

function CallStatusIndicator({ booked }: { booked: boolean }) {
  return (
    <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${booked ? "bg-[#22c55e]" : "bg-zinc-500"}`}
        aria-hidden="true"
      />
      {booked ? "Call Booked" : "No Call"}
    </div>
  );
}

export default function MembersPanel() {
  const isMobile = useIsMobile();
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
  const [playbookNotesDraft, setPlaybookNotesDraft] = useState("");
  const [playbookNotesError, setPlaybookNotesError] = useState("");
  const [playbookNotesSuccess, setPlaybookNotesSuccess] = useState("");
  const [isSavingPlaybookNotes, setIsSavingPlaybookNotes] = useState(false);
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
      setPlaybookNotesDraft(data.member.playbook?.coachNotes ?? "");
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

  const handleSavePlaybookNotes = async () => {
    if (!detail) {
      return;
    }

    setIsSavingPlaybookNotes(true);
    setPlaybookNotesError("");
    setPlaybookNotesSuccess("");

    try {
      const response = await fetch(`/api/admin/members/${detail.id}/playbook-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachNotes: playbookNotesDraft }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setPlaybookNotesError(data.error ?? "Unable to save playbook notes.");
        return;
      }

      setPlaybookNotesSuccess("Playbook notes saved.");
    } catch {
      setPlaybookNotesError("Unable to save playbook notes.");
    } finally {
      setIsSavingPlaybookNotes(false);
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

  const closeMobileDetail = () => {
    setSelectedId(null);
  };

  const detailContentProps = (hideStickyActions: boolean) =>
    detail
      ? {
          detail,
          tierDraft,
          notesDraft,
          playbookNotesDraft,
          callDate,
          callTime,
          tierError,
          tierSuccess,
          notesError,
          notesSuccess,
          playbookNotesError,
          playbookNotesSuccess,
          callError,
          callSuccess,
          showCallForm,
          isSavingTier,
          isSavingNotes,
          isSavingPlaybookNotes,
          isSavingCall,
          hideStickyActions,
          onTierDraftChange: setTierDraft,
          onNotesDraftChange: setNotesDraft,
          onPlaybookNotesDraftChange: setPlaybookNotesDraft,
          onCallDateChange: setCallDate,
          onCallTimeChange: setCallTime,
          onSaveTier: handleSaveTier,
          onSaveNotes: handleSaveNotes,
          onSavePlaybookNotes: handleSavePlaybookNotes,
          onSaveCall: handleSaveCall,
          onOpenCallEditForm: openCallEditForm,
          onCancelCallForm: () => {
            setShowCallForm(false);
            setCallError("");
          },
        }
      : null;

  const mobileSheetFooter = detail ? (
    <div className="flex flex-col gap-2">
      {(tierError || tierSuccess || notesError || notesSuccess) && (
        <div className="space-y-1 text-sm">
          {tierError ? <p className="text-red-300">{tierError}</p> : null}
          {tierSuccess ? <p className="text-[#9df3bd]">{tierSuccess}</p> : null}
          {notesError ? <p className="text-red-300">{notesError}</p> : null}
          {notesSuccess ? <p className="text-[#9df3bd]">{notesSuccess}</p> : null}
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSaveTier}
          disabled={isSavingTier}
          className="inline-flex flex-1 items-center justify-center rounded-full border border-[#2b3650] bg-black/40 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-[#7f9434] hover:text-[#98b144] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSavingTier ? "Saving..." : "Save Tier"}
        </button>
        <button
          type="button"
          onClick={handleSaveNotes}
          disabled={isSavingNotes}
          className="inline-flex flex-1 items-center justify-center rounded-full bg-[#22c55e] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSavingNotes ? "Saving..." : "Save Notes"}
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="mt-6 grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-[#18243a] bg-black/30 p-3 sm:p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="w-full flex-1">
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
            <div className="w-full md:w-auto">
              <label
                className="block text-sm font-medium text-zinc-200"
                htmlFor="member-tier-filter"
              >
                Filter by tier
              </label>
              <select
                id="member-tier-filter"
                value={tierFilter}
                onChange={(event) => setTierFilter(event.target.value as TierFilter)}
                className="mt-2 w-full rounded-lg border border-[#2b3650] bg-[#0b1324]/80 px-3 py-2 text-sm text-zinc-100 md:min-w-[180px]"
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

          {loadingList ? (
            <p className="mt-4 text-sm text-zinc-400">Loading members...</p>
          ) : filteredMembers.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">No members match your search.</p>
          ) : (
            <>
              <div className="mt-4 space-y-3 md:hidden">
                {filteredMembers.map((member) => {
                  const callBooked =
                    member.assessmentCallBooked && Boolean(member.assessmentCallDate);

                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedId(member.id)}
                      className="w-full rounded-xl border border-[#18243a] bg-black/30 p-4 text-left transition hover:border-[#2b3650] hover:bg-[#0b1324]/80"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-white">
                            {member.name?.trim() || "Unnamed member"}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-zinc-400">{member.email}</p>
                        </div>
                        <TierBadge tier={member.membershipTier} />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
                        <span>Member since {formatShortDate(member.signupDate)}</span>
                        <span>
                          {member.submissionCount}{" "}
                          {member.submissionCount === 1 ? "submission" : "submissions"}
                        </span>
                      </div>
                      <CallStatusIndicator booked={callBooked} />
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 hidden overflow-x-auto md:block">
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
                            isSelected ? "bg-[#22c55e]/10" : "hover:bg-[#0b1324]/80"
                          }`}
                        >
                          <td className="px-3 py-3 font-medium text-zinc-100">
                            {member.name?.trim() || "Unnamed member"}
                          </td>
                          <td className="px-3 py-3 text-zinc-300">{member.email}</td>
                          <td className="px-3 py-3">
                            <TierBadge tier={member.membershipTier} />
                          </td>
                          <td className="px-3 py-3 text-zinc-300">
                            {formatDate(member.signupDate)}
                          </td>
                          <td className="px-3 py-3 text-zinc-300">
                            {member.lastActiveAt
                              ? formatDateTime(member.lastActiveAt)
                              : "Not available"}
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
              </div>
            </>
          )}
        </section>

        <aside className="hidden rounded-2xl border border-[#18243a] bg-black/30 p-4 sm:p-5 md:block">
          {!selectedId ? (
            <p className="text-sm text-zinc-400">Select a member to view details.</p>
          ) : loadingDetail ? (
            <p className="text-sm text-zinc-400">Loading member details...</p>
          ) : !detail ? (
            <p className="text-sm text-zinc-400">Unable to load member details.</p>
          ) : (
            <MemberDetailContent {...detailContentProps(false)!} />
          )}
        </aside>
      </div>

      {isMobile ? (
        <MobileBottomSheet
          open={Boolean(selectedId)}
          onClose={closeMobileDetail}
          variant="admin"
          title={detail?.name?.trim() || "Member details"}
          ariaLabel="Member details"
          footer={mobileSheetFooter}
        >
          {!selectedId ? null : loadingDetail ? (
            <p className="text-sm text-zinc-400">Loading member details...</p>
          ) : !detail ? (
            <p className="text-sm text-zinc-400">Unable to load member details.</p>
          ) : (
            <MemberDetailContent {...detailContentProps(true)!} />
          )}
        </MobileBottomSheet>
      ) : null}
    </>
  );
}
