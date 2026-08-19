"use client";

import MemberProfileCard from "@/app/admin/MemberProfileCard";
import {
  formatAssessmentCallDateTime,
  toAssessmentCallInputValues,
} from "@/lib/assessment-call";
import { formatDatabaseTierLabel, validDatabaseTiers, type DatabaseTier } from "@/lib/membership";
import TierBadge from "@/app/admin/TierBadge";

export type MemberDetail = {
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
  playbook: {
    overallComplete: boolean;
    completedAt: string | null;
    coachNotes: string | null;
    percentComplete: number;
    chapters: Array<{
      chapterNumber: number;
      chapterTitle: string;
      completed: boolean;
      completedAt: string | null;
      sharedAt: string | null;
      sharedReflections: Array<{
        questionNumber: number;
        questionText: string;
        answer: string | null;
        sharedAt: string | null;
      }>;
    }>;
  } | null;
};

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

type MemberDetailContentProps = {
  detail: MemberDetail;
  tierDraft: DatabaseTier;
  notesDraft: string;
  playbookNotesDraft: string;
  callDate: string;
  callTime: string;
  tierError: string;
  tierSuccess: string;
  notesError: string;
  notesSuccess: string;
  playbookNotesError: string;
  playbookNotesSuccess: string;
  callError: string;
  callSuccess: string;
  showCallForm: boolean;
  isSavingTier: boolean;
  isSavingNotes: boolean;
  isSavingPlaybookNotes: boolean;
  isSavingCall: boolean;
  hideStickyActions?: boolean;
  onTierDraftChange: (tier: DatabaseTier) => void;
  onNotesDraftChange: (notes: string) => void;
  onPlaybookNotesDraftChange: (notes: string) => void;
  onCallDateChange: (date: string) => void;
  onCallTimeChange: (time: string) => void;
  onSaveTier: () => void;
  onSaveNotes: () => void;
  onSavePlaybookNotes: () => void;
  onSaveCall: () => void;
  onOpenCallEditForm: () => void;
  onCancelCallForm: () => void;
};

export default function MemberDetailContent({
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
  hideStickyActions = false,
  onTierDraftChange,
  onNotesDraftChange,
  onPlaybookNotesDraftChange,
  onCallDateChange,
  onCallTimeChange,
  onSaveTier,
  onSaveNotes,
  onSavePlaybookNotes,
  onSaveCall,
  onOpenCallEditForm,
  onCancelCallForm,
}: MemberDetailContentProps) {
  return (
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
            <>Booked - {formatAssessmentCallDateTime(new Date(detail.assessmentCallDate))}</>
          ) : (
            "Not Booked"
          )}
        </p>
        {detail.monthlySubmissionsRemaining !== null ? (
          <p className="mt-2">
            <span className="font-semibold text-zinc-100">Monthly submissions remaining:</span>{" "}
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
              onClick={onOpenCallEditForm}
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
                    onChange={(event) => onCallDateChange(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-zinc-100"
                  />
                </label>
                <label className="block text-sm text-zinc-300">
                  Call time
                  <input
                    type="time"
                    value={callTime}
                    onChange={(event) => onCallTimeChange(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-zinc-100"
                  />
                </label>
              </div>
              {callError ? <p className="text-sm text-red-300">{callError}</p> : null}
              {callSuccess ? <p className="text-sm text-[#9df3bd]">{callSuccess}</p> : null}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onSaveCall}
                  disabled={isSavingCall}
                  className="inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingCall ? "Saving..." : "Save Call"}
                </button>
                <button
                  type="button"
                  onClick={onCancelCallForm}
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
                  {submission.type === "SWING" ? "Swing Analysis" : "Mental Game"} -{" "}
                  {submission.subtitle}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{formatDateTime(submission.createdAt)}</p>
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
                <p className="mt-1 text-xs text-zinc-500">{formatDateTime(checkin.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4">
        <p className="text-sm font-semibold text-zinc-100">Playbook</p>
        {!detail.playbook ? (
          <p className="mt-3 text-sm text-zinc-400">No playbook progress yet.</p>
        ) : (
          <div className="mt-3 space-y-4">
            <p className="text-sm text-zinc-300">
              <span className="font-semibold text-zinc-100">Overall completion:</span>{" "}
              {detail.playbook.percentComplete}%
            </p>
            <div className="space-y-2">
              {detail.playbook.chapters.map((chapter) => (
                <p key={chapter.chapterNumber} className="text-sm text-zinc-300">
                  Chapter {chapter.chapterNumber}: {chapter.chapterTitle} -{" "}
                  {chapter.completed ? "Complete" : "In progress"}
                </p>
              ))}
            </div>

            {detail.playbook.chapters.some((chapter) => chapter.sharedReflections.length > 0) ? (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-zinc-100">
                  Shared Reflections With Coach Broc
                </p>
                {detail.playbook.chapters.map((chapter) => {
                  if (chapter.sharedReflections.length === 0) {
                    return null;
                  }

                  return (
                    <div
                      key={chapter.chapterNumber}
                      className="rounded-lg border border-[#2b3650] bg-black/30 p-3"
                    >
                      <p className="text-sm font-semibold text-zinc-100">
                        Chapter {chapter.chapterNumber}: {chapter.chapterTitle}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Shared {formatDateTime(chapter.sharedAt)}
                      </p>
                      <div className="mt-3 space-y-3">
                        {chapter.sharedReflections.map((reflection) => (
                          <div key={reflection.questionNumber}>
                            <p className="text-xs font-medium text-[#9df3bd]">
                              {reflection.questionText}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-200">
                              {reflection.answer?.trim() || "No answer provided."}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">No shared reflections yet.</p>
            )}

            <div>
              <p className="text-sm font-semibold text-zinc-100">Private Playbook Coach Notes</p>
              <textarea
                value={playbookNotesDraft}
                onChange={(event) => onPlaybookNotesDraftChange(event.target.value)}
                rows={4}
                placeholder="Add private notes about this member's playbook reflections..."
                className="mt-3 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-sm text-zinc-100"
              />
              {playbookNotesError ? (
                <p className="mt-3 text-sm text-red-300">{playbookNotesError}</p>
              ) : null}
              {playbookNotesSuccess ? (
                <p className="mt-3 text-sm text-[#9df3bd]">{playbookNotesSuccess}</p>
              ) : null}
              <button
                type="button"
                onClick={onSavePlaybookNotes}
                disabled={isSavingPlaybookNotes}
                className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingPlaybookNotes ? "Saving..." : "Save Playbook Notes"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4">
        <p className="text-sm font-semibold text-zinc-100">Manual Tier Override</p>
        <p className="mt-2 text-xs text-zinc-400">
          Update this member&apos;s tier directly without Stripe checkout. Stripe billing fields are
          cleared when you save.
        </p>
        <label className="mt-4 block text-sm text-zinc-300">
          Membership tier
          <select
            value={tierDraft}
            onChange={(event) => onTierDraftChange(event.target.value as DatabaseTier)}
            className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-zinc-100"
          >
            {validDatabaseTiers.map((tier) => (
              <option key={tier} value={tier}>
                {formatDatabaseTierLabel(tier)}
              </option>
            ))}
          </select>
        </label>
        {tierError && !hideStickyActions ? (
          <p className="mt-3 text-sm text-red-300">{tierError}</p>
        ) : null}
        {tierSuccess && !hideStickyActions ? (
          <p className="mt-3 text-sm text-[#9df3bd]">{tierSuccess}</p>
        ) : null}
        {!hideStickyActions ? (
          <button
            type="button"
            onClick={onSaveTier}
            disabled={isSavingTier}
            className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingTier ? "Saving..." : "Save Tier"}
          </button>
        ) : null}
      </div>

      <div className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4">
        <p className="text-sm font-semibold text-zinc-100">Private Coach Notes</p>
        <p className="mt-2 text-xs text-zinc-400">These notes are only visible in the admin portal.</p>
        <textarea
          value={notesDraft}
          onChange={(event) => onNotesDraftChange(event.target.value)}
          rows={5}
          placeholder="Add private notes about this member..."
          className="mt-4 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-sm text-zinc-100"
        />
        {notesError && !hideStickyActions ? (
          <p className="mt-3 text-sm text-red-300">{notesError}</p>
        ) : null}
        {notesSuccess && !hideStickyActions ? (
          <p className="mt-3 text-sm text-[#9df3bd]">{notesSuccess}</p>
        ) : null}
        {!hideStickyActions ? (
          <button
            type="button"
            onClick={onSaveNotes}
            disabled={isSavingNotes}
            className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingNotes ? "Saving..." : "Save Notes"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
