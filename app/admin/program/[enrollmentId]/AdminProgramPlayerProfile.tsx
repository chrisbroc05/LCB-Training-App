"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import AdminProgramPlayerPanel from "@/app/admin/program/[enrollmentId]/AdminProgramPlayerPanel";
import AdminPlayerVideoInlineCard from "@/app/admin/program/[enrollmentId]/AdminPlayerVideoInlineCard";
import { formatDateTime } from "@/lib/format-date";
import type { CoachVideoListItem } from "@/lib/coach-video-shared";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "this-week", label: "This Week" },
  { id: "goals", label: "Goals" },
  { id: "videos", label: "Videos" },
  { id: "stats", label: "Stats" },
  { id: "notes", label: "Notes" },
  { id: "settings", label: "Settings" },
] as const;

const STORAGE_PREFIX = "admin-player-section:";

const STATUS_LABELS: Record<string, string> = {
  on_track: "On track",
  slipping: "Slipping",
  gone_quiet: "Gone quiet",
  waiting_on_setup: "Waiting on setup",
  program_ended: "Program ended",
};

const STATUS_CLASS: Record<string, string> = {
  on_track: "bg-emerald-500/20 text-emerald-200",
  slipping: "bg-amber-500/20 text-amber-200",
  gone_quiet: "bg-red-500/20 text-red-200",
  waiting_on_setup: "bg-zinc-500/20 text-zinc-200",
  program_ended: "bg-zinc-600/20 text-zinc-300",
};

type CoachNoteRow = {
  id: string;
  body: string;
  pinned: boolean;
  updatedAt: string;
};

type ProfilePayload = {
  header: {
    status: string;
    weekNumber: number;
    streak: number;
    weekCompletionPercent: number;
    weekTasksDone: number;
    weekTasksDue: number;
    startDateLabel: string;
    endDateLabel: string;
    lastActiveLabel: string;
    progressPercent: number;
    pinnedNotePreview: string | null;
    playerName: string;
    playerFirstName: string;
    position: string | null;
    ageGroupLabel: string | null;
  };
  overview: {
    knownFor: string | null;
    focusAreaLabels: string[];
    position: string | null;
    equipmentLabels: string[];
    strengthVariantLabel: string;
    seasonModeLabel: string | null;
    ageGroupLabel: string | null;
    email: string;
    parentEmail: string | null;
    parentName: string | null;
    parentEmailsEnabled: boolean;
    dailyRoutineEmailsEnabled: boolean;
    activeTrackPills: Array<{ trackKey: string; label: string; note: string | null }>;
    inPersonTraining: {
      trainsInPerson: boolean;
      emergencyContactName: string | null;
      emergencyContactPhone: string | null;
      medicalNotes: string | null;
    };
    legalAcceptance: {
      termsVersion: string | null;
      termsAcceptedAtLabel: string;
      acceptedByName: string | null;
      agreementRoleLabel: string;
      mediaConsentLabel: string;
      parentConsentStatus: string | null;
    };
  } | null;
  attention: Array<{
    id: string;
    label: string;
    detail?: string;
    href?: string;
    actionLabel?: string;
  }>;
  coachNotes: CoachNoteRow[];
  goals: {
    current: {
      id: string;
      monthlyFocus: string | null;
      lastMonthReview: string | null;
      focusArea: string | null;
      additionalNotes: string | null;
      coachResponse: string | null;
      status: string;
      createdAt: string;
      goals: Array<{
        id: string;
        category: string;
        description: string;
        targetValue: string | null;
        completed: boolean;
      }>;
    } | null;
    history: Array<{
      id: string;
      createdAt: string;
      monthlyFocus: string | null;
      coachResponse: string | null;
    }>;
  };
  submissions: Array<{
    id: number | string;
    type: "swing" | "mental";
    createdAt: string;
    status: string;
    note: string | null;
    href: string;
    respondedAt: string | null;
  }>;
  videoSections: {
    fromPlayer: Array<{
      id: string;
      type: "swing" | "mental";
      title: string;
      createdAt: string;
      href: string;
      status: string;
      note: string | null;
      playerVideoKey: string | null;
    }>;
    sentByCoach: CoachVideoListItem[];
  };
  goalChatPrefill: string;
  testingSummary: { playerId: string; href: string } | null;
};

function CollapsibleSection({
  id,
  title,
  children,
  defaultOpen = true,
}: {
  id: string;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const storageKey = `${STORAGE_PREFIX}${id}`;
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved === "0") {
        setOpen(false);
      } else if (saved === "1") {
        setOpen(true);
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const toggle = () => {
    setOpen((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(storageKey, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <section id={id} className="scroll-mt-36 rounded-2xl border border-[#18243a] bg-[#0b1324]/80">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
      >
        <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
        <span className="text-xs font-semibold text-zinc-500">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? <div className="space-y-4 border-t border-[#18243a] px-4 pb-4 pt-3">{children}</div> : null}
    </section>
  );
}

export default function AdminProgramPlayerProfile({ enrollmentId }: { enrollmentId: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [newNote, setNewNote] = useState("");
  const [showSendVideo, setShowSendVideo] = useState(false);
  const [showPastGoals, setShowPastGoals] = useState(false);

  const loadProfile = useCallback(async () => {
    const response = await fetch(`/api/admin/program/enrollments/${enrollmentId}`);
    const data = (await response.json().catch(() => ({}))) as {
      profile?: ProfilePayload;
    };
    setProfile(data.profile ?? null);
  }, [enrollmentId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const header = profile?.header;
  const attentionItems = useMemo(() => profile?.attention ?? [], [profile]);
  const overview = profile?.overview;

  const openMessage = (draft?: string) => {
    void (async () => {
      const response = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId }),
      });
      const data = (await response.json().catch(() => ({}))) as { conversationId?: string };
      if (response.ok && data.conversationId) {
        const query = draft ? `?draft=${encodeURIComponent(draft)}` : "";
        router.push(`/admin/messages/${data.conversationId}${query}`);
      }
    })();
  };

  const saveNote = async () => {
    if (!newNote.trim()) {
      return;
    }
    await fetch(`/api/admin/program/enrollments/${enrollmentId}/coach-notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newNote }),
    });
    setNewNote("");
    await loadProfile();
  };

  const updateNote = async (noteId: string, patch: { pinned?: boolean; body?: string }) => {
    await fetch(`/api/admin/program/enrollments/${enrollmentId}/coach-notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await loadProfile();
  };

  const deleteNote = async (noteId: string) => {
    await fetch(`/api/admin/program/enrollments/${enrollmentId}/coach-notes/${noteId}`, {
      method: "DELETE",
    });
    await loadProfile();
  };

  return (
    <div className="flex flex-col space-y-6 pb-24">
      <div className="sticky top-0 z-20 -mx-4 border-b border-[#18243a] bg-[#070d18]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <Link href="/admin/program" className="text-xs font-semibold text-[#52B788]">
          Back to overview
        </Link>
        {header ? (
          <>
            <h1 className="mt-2 text-2xl font-bold text-zinc-100">{header.playerName}</h1>
            <p className="mt-1 text-xs text-zinc-400">
              {[header.ageGroupLabel, header.position].filter(Boolean).join(" . ") || "Profile"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[header.status] ?? STATUS_CLASS.on_track}`}
              >
                {STATUS_LABELS[header.status] ?? header.status}
              </span>
              <span className="text-xs text-zinc-400">
                Week {header.weekNumber} of 12
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#2b3650]">
              <div
                className="h-full bg-[#52B788]"
                style={{ width: `${Math.min(100, header.progressPercent)}%` }}
              />
            </div>
            <p className="mt-2 text-3xl font-bold text-zinc-100">{header.weekCompletionPercent}%</p>
            <p className="text-xs text-zinc-400">
              This week: {header.weekTasksDone} of {header.weekTasksDue} tasks due so far . Streak{" "}
              {header.streak} . Last active {header.lastActiveLabel}
            </p>
            <div className="mt-1 grid grid-cols-2 gap-1 text-xs text-zinc-500">
              <span>Start {header.startDateLabel}</span>
              <span>End {header.endDateLabel}</span>
            </div>
            {header.pinnedNotePreview ? (
              <p className="mt-2 text-xs italic text-zinc-400">{header.pinnedNotePreview}</p>
            ) : null}
            {overview?.activeTrackPills && overview.activeTrackPills.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {overview.activeTrackPills.map((pill) => (
                  <span
                    key={pill.trackKey}
                    className="rounded-full bg-[#52B788]/15 px-2.5 py-0.5 text-xs font-semibold text-[#9df3bd]"
                    title={pill.note ?? undefined}
                  >
                    {pill.label}
                  </span>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="shrink-0 rounded-full border border-[#2b3650] px-3 py-1.5 text-xs font-semibold text-zinc-300"
            >
              {section.label}
            </a>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openMessage()}
            className="rounded-full border border-[#52B788] px-3 py-1.5 text-xs font-semibold text-[#52B788]"
          >
            Message
          </button>
          <button
            type="button"
            onClick={() => setShowSendVideo(true)}
            className="rounded-full bg-[#52B788] px-3 py-1.5 text-xs font-semibold text-black"
          >
            Send video
          </button>
          <a
            href="#this-week"
            className="rounded-full border border-[#2b3650] px-3 py-1.5 text-xs font-semibold text-zinc-300"
          >
            Set focus
          </a>
          <a
            href="#this-week"
            className="rounded-full border border-[#2b3650] px-3 py-1.5 text-xs font-semibold text-zinc-300"
          >
            Add task
          </a>
        </div>
      </div>

      {attentionItems.length > 0 ? (
        <section className="rounded-2xl border border-amber-500/30 bg-[#0b1324]/80 p-4">
          <h2 className="text-sm font-semibold text-amber-100">Needs your attention</h2>
          <ul className="mt-3 space-y-2">
            {attentionItems.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#2b3650] bg-black/20 p-3"
              >
                <div>
                  <p className="text-sm text-zinc-100">{item.label}</p>
                  {item.detail ? <p className="text-xs text-zinc-500">{item.detail}</p> : null}
                </div>
                {item.id === "no-goals" && profile?.goalChatPrefill ? (
                  <button
                    type="button"
                    onClick={() => openMessage(profile.goalChatPrefill)}
                    className="text-xs font-semibold text-[#52B788]"
                  >
                    Open chat
                  </button>
                ) : item.href ? (
                  item.href.startsWith("#") ? (
                    <a href={item.href} className="text-xs font-semibold text-[#52B788]">
                      {item.actionLabel ?? "Open"}
                    </a>
                  ) : (
                    <Link href={item.href} className="text-xs font-semibold text-[#52B788]">
                      {item.actionLabel ?? "Open"}
                    </Link>
                  )
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {overview ? (
        <CollapsibleSection id="overview" title="Overview">
          {overview.activeTrackPills.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {overview.activeTrackPills.map((pill) => (
                <span
                  key={pill.trackKey}
                  className="rounded-full border border-[#52B788]/40 bg-[#52B788]/10 px-3 py-1 text-xs font-semibold text-[#9df3bd]"
                >
                  {pill.label}
                </span>
              ))}
            </div>
          ) : null}
          {overview.knownFor ? (
            <p className="text-2xl font-semibold leading-snug text-zinc-100">
              &quot;{overview.knownFor}&quot;
            </p>
          ) : (
            <p className="text-sm text-zinc-500">No known-for answer yet.</p>
          )}
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-zinc-500">Focus areas</dt>
              <dd className="text-zinc-200">{overview.focusAreaLabels.join(", ") || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Position</dt>
              <dd className="text-zinc-200">{overview.position ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Equipment</dt>
              <dd className="text-zinc-200">{overview.equipmentLabels.join(", ") || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Strength</dt>
              <dd className="text-zinc-200">{overview.strengthVariantLabel}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Season</dt>
              <dd className="text-zinc-200">{overview.seasonModeLabel ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Age group</dt>
              <dd className="text-zinc-200">{overview.ageGroupLabel ?? "Not set"}</dd>
            </div>
          </dl>
          <div className="rounded-xl border border-[#2b3650] bg-black/20 p-3 text-sm">
            <p className="text-xs font-semibold text-zinc-500">Contacts</p>
            <p className="mt-2 text-zinc-200">{overview.email}</p>
            <p className="mt-1 text-zinc-400">
              Second email:{" "}
              {overview.parentEmail
                ? `${overview.parentName ?? "Parent"} (${overview.parentEmail})${
                    overview.parentEmailsEnabled ? "" : ", emails off"
                  }`
                : "Not set"}
            </p>
            <p className="mt-1 text-zinc-400">
              Daily routine emails: {overview.dailyRoutineEmailsEnabled ? "On" : "Off"}
            </p>
            {overview.inPersonTraining.trainsInPerson ? (
              <p className="mt-2 text-zinc-400">
                Emergency:{" "}
                {overview.inPersonTraining.emergencyContactName &&
                overview.inPersonTraining.emergencyContactPhone
                  ? `${overview.inPersonTraining.emergencyContactName} (${overview.inPersonTraining.emergencyContactPhone})`
                  : "Not set"}
              </p>
            ) : null}
          </div>
          <div className="rounded-xl border border-[#2b3650] bg-black/20 p-3 text-sm text-zinc-300">
            <p className="text-xs font-semibold text-zinc-500">Legal</p>
            <p className="mt-2">Terms {overview.legalAcceptance.termsVersion ?? "n/a"}</p>
            <p className="mt-1">Accepted {overview.legalAcceptance.termsAcceptedAtLabel}</p>
            {overview.legalAcceptance.acceptedByName ? (
              <p className="mt-1">
                By {overview.legalAcceptance.acceptedByName} (
                {overview.legalAcceptance.agreementRoleLabel})
              </p>
            ) : null}
            <p className="mt-1">Media: {overview.legalAcceptance.mediaConsentLabel}</p>
            {overview.legalAcceptance.parentConsentStatus ? (
              <p className="mt-1">{overview.legalAcceptance.parentConsentStatus}</p>
            ) : null}
          </div>
        </CollapsibleSection>
      ) : null}

      <AdminProgramPlayerPanel
        enrollmentId={enrollmentId}
        embedded
        showSendVideo={showSendVideo}
        onSendVideoClose={() => setShowSendVideo(false)}
        onFeedbackChange={loadProfile}
      />

      <CollapsibleSection id="goals" title="Goals" defaultOpen={Boolean(profile?.goals.current)}>
        {!profile?.goals.current ? (
          <div className="space-y-3">
            <p className="text-sm text-zinc-400">No goals yet.</p>
            {profile?.goalChatPrefill ? (
              <button
                type="button"
                onClick={() => openMessage(profile.goalChatPrefill)}
                className="rounded-full bg-[#52B788] px-4 py-2 text-xs font-semibold text-black"
              >
                Message to set goals
              </button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3 text-sm text-zinc-300">
            <p className="text-xs text-zinc-500">Check-in {profile.goals.current.createdAt}</p>
            {profile.goals.current.monthlyFocus ? (
              <p className="text-lg font-semibold text-zinc-100">{profile.goals.current.monthlyFocus}</p>
            ) : null}
            <ul className="space-y-2">
              {profile.goals.current.goals.map((goal) => (
                <li key={goal.id} className="rounded-lg border border-[#2b3650] bg-black/20 p-3">
                  <p className="font-semibold text-zinc-100">{goal.description}</p>
                  <p className="text-xs text-zinc-500">
                    {goal.category}
                    {goal.targetValue ? ` . Target ${goal.targetValue}` : ""}
                    {goal.completed ? " . Done" : ""}
                  </p>
                </li>
              ))}
            </ul>
            {profile.goals.current.coachResponse ? (
              <p className="rounded-lg border border-[#52B788]/30 bg-[#52B788]/10 p-3 text-zinc-100">
                {profile.goals.current.coachResponse}
              </p>
            ) : null}
          </div>
        )}
        {profile && profile.goals.history.length > 0 ? (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowPastGoals((current) => !current)}
              className="text-xs font-semibold text-[#52B788]"
            >
              {showPastGoals ? "Hide past goals" : "Show past goals"}
            </button>
            {showPastGoals ? (
              <ul className="mt-2 space-y-2 text-sm text-zinc-400">
                {profile.goals.history.map((entry) => (
                  <li key={entry.id} className="rounded-lg border border-[#2b3650] p-2">
                    {entry.createdAt}
                    {entry.monthlyFocus ? ` . ${entry.monthlyFocus}` : ""}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </CollapsibleSection>

      <CollapsibleSection id="videos" title="Videos">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Videos from player</p>
        {profile?.videoSections.fromPlayer.length ? (
          <div className="space-y-4">
            {profile.videoSections.fromPlayer.map((item) =>
              item.playerVideoKey ? (
                <AdminPlayerVideoInlineCard
                  key={`${item.type}-${item.id}`}
                  title={item.title}
                  createdAt={item.createdAt}
                  videoKey={item.playerVideoKey}
                  note={item.note}
                  href={item.href}
                />
              ) : (
                <article
                  key={`${item.type}-${item.id}`}
                  className="rounded-xl border border-[#2b3650] bg-black/20 p-3"
                >
                  <Link href={item.href} className="text-sm font-semibold text-[#52B788]">
                    {item.title}
                  </Link>
                  <p className="mt-1 text-xs text-zinc-500">{formatDateTime(item.createdAt)}</p>
                  <p className="text-xs text-zinc-400">{item.status}</p>
                  {item.note ? <p className="mt-2 text-sm text-zinc-300">{item.note}</p> : null}
                </article>
              ),
            )}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No submissions yet.</p>
        )}
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Videos I&apos;ve sent</p>
        {profile?.videoSections.sentByCoach.length ? (
          <div className="space-y-4">
            {profile.videoSections.sentByCoach.map((video) => (
              <AdminPlayerVideoInlineCard
                key={video.id}
                title={video.title}
                createdAt={video.createdAt}
                videoKey={video.videoKey}
                note={video.note}
                watchedLabel={
                  video.source === "coach_video"
                    ? video.viewedAt
                      ? "Watched"
                      : "Not watched yet"
                    : "Response video"
                }
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No coach videos sent yet.</p>
        )}
      </CollapsibleSection>

      {profile?.testingSummary ? (
        <CollapsibleSection id="testing" title="Testing" defaultOpen={false}>
          <Link href={profile.testingSummary.href} className="text-sm font-semibold text-[#52B788]">
            Open testing profile
          </Link>
        </CollapsibleSection>
      ) : null}

      <CollapsibleSection id="notes" title="Coach notes">
        <textarea
          value={newNote}
          onChange={(event) => setNewNote(event.target.value)}
          rows={3}
          placeholder="Private note only you see..."
          className="w-full rounded-xl border border-[#2b3650] bg-black/30 px-3 py-2 text-sm text-zinc-100"
        />
        <button
          type="button"
          onClick={() => void saveNote()}
          className="rounded-full bg-[#52B788] px-4 py-2 text-xs font-semibold text-black"
        >
          Save note
        </button>
        <div className="space-y-2">
          {profile?.coachNotes.map((note) => (
            <article key={note.id} className="rounded-xl border border-[#2b3650] p-3 text-sm text-zinc-300">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void updateNote(note.id, { pinned: !note.pinned })}
                  className="text-xs font-semibold text-amber-200"
                >
                  {note.pinned ? "Unpin" : "Pin"}
                </button>
                <button
                  type="button"
                  onClick={() => void deleteNote(note.id)}
                  className="text-xs font-semibold text-red-300"
                >
                  Delete
                </button>
              </div>
              <p className="mt-2">{note.body}</p>
              <p className="mt-1 text-xs text-zinc-500">{note.updatedAt}</p>
            </article>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
