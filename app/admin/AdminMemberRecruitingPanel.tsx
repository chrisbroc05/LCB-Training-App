"use client";

import { useEffect, useState } from "react";
import { adminFetchJson } from "@/lib/admin-fetch-shared";
import CoachFormattedText from "@/components/CoachFormattedText";
import CoachTextFormattingHint from "@/components/CoachTextFormattingHint";
import {
  isRecruitingWaitingOnList,
  labelForRecruitingLocation,
  labelForRecruitingScholarship,
  labelForRecruitingSchoolSize,
  type RecruitingProfileView,
} from "@/lib/recruiting-shared";

type AdminMemberRecruitingPanelProps = {
  memberId: string;
};

function AnswerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[160px_1fr] sm:gap-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="text-sm text-zinc-200">{value || "--"}</p>
    </div>
  );
}

export default function AdminMemberRecruitingPanel({ memberId }: AdminMemberRecruitingPanelProps) {
  const [profile, setProfile] = useState<RecruitingProfileView | null>(null);
  const [copyText, setCopyText] = useState("");
  const [schoolListDraft, setSchoolListDraft] = useState("");
  const [notifyPlayer, setNotifyPlayer] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      const res = await adminFetchJson<{
        profile?: RecruitingProfileView;
        copyText?: string;
        error?: string;
      }>(`/api/admin/members/${memberId}/recruiting`);
      setLoading(false);
      if (!res.ok) {
        setError(res.userMessage);
        return;
      }
      const next = res.data.profile ?? null;
      setProfile(next);
      setCopyText(res.data.copyText ?? "");
      setSchoolListDraft(next?.coachSchoolList ?? "");
    })();
  }, [memberId]);

  const copyForResearch = async () => {
    if (!copyText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(copyText);
      setStatus("Copied for research.");
    } catch {
      setError("Unable to copy. Select the text manually if needed.");
    }
  };

  const saveSchoolList = async () => {
    setSaving(true);
    setError("");
    setStatus("");
    const res = await adminFetchJson<{
      profile?: RecruitingProfileView;
      pushSent?: boolean;
      error?: string;
    }>(
      `/api/admin/members/${memberId}/recruiting`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coachSchoolList: schoolListDraft,
          notifyPlayer,
        }),
      },
      {
        context: "admin-member-recruiting-school-list",
        okUserMessage: "Unable to save school list.",
      },
    );
    setSaving(false);
    if (!res.ok) {
      setError(res.userMessage);
      return;
    }
    const next = res.data.profile ?? null;
    setProfile(next);
    setSchoolListDraft(next?.coachSchoolList ?? "");
    setStatus(
      res.data.pushSent
        ? "School list saved. Player notified."
        : "School list saved.",
    );
  };

  if (loading) {
    return <p className="text-sm text-zinc-400">Loading recruiting...</p>;
  }

  if (!profile) {
    return <p className="text-sm text-zinc-400">No recruiting profile yet.</p>;
  }

  return (
    <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">Recruiting</h2>
          <p className="mt-1 text-xs text-zinc-500">
            {profile.enabled
              ? isRecruitingWaitingOnList(profile)
                ? "Help is on. Waiting on school list."
                : "Help is on."
              : "Help is off. Answers are kept if they filled them out earlier."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void copyForResearch()}
          className="rounded-full border border-[#52B788]/50 px-3 py-1.5 text-xs font-semibold text-[#9df3bd]"
        >
          Copy for research
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <AnswerRow label="Grad year" value={profile.gradYear != null ? String(profile.gradYear) : ""} />
        <AnswerRow label="Primary position" value={profile.primaryPosition ?? ""} />
        <AnswerRow label="Secondary position" value={profile.secondaryPosition ?? ""} />
        <AnswerRow
          label="Levels open to"
          value={profile.levelsOpenTo.length > 0 ? profile.levelsOpenTo.join(", ") : ""}
        />
        <AnswerRow
          label="Location"
          value={labelForRecruitingLocation(profile.locationPreference)}
        />
        <AnswerRow
          label="School size"
          value={labelForRecruitingSchoolSize(profile.schoolSize)}
        />
        <AnswerRow label="Major / study" value={profile.majorOrStudy ?? ""} />
        <AnswerRow label="GPA range" value={profile.gpaRange ?? ""} />
        <AnswerRow
          label="Scholarship"
          value={labelForRecruitingScholarship(profile.scholarshipImportance)}
        />
        <AnswerRow label="Video link" value={profile.videoUrl ?? ""} />
        <AnswerRow label="Notes" value={profile.notesForCoach ?? ""} />
      </div>

      <div className="mt-5">
        <label className="block text-sm text-zinc-300">
          Coach Broc&apos;s school list
          <textarea
            value={schoolListDraft}
            onChange={(event) => setSchoolListDraft(event.target.value)}
            rows={6}
            className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-sm text-zinc-100"
          />
        </label>
        <CoachTextFormattingHint />
        <p className="mt-1 text-xs text-zinc-500">
          Links: paste full http/https URLs. They become clickable for the player.
        </p>
        <label className="mt-3 flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={notifyPlayer}
            onChange={(event) => setNotifyPlayer(event.target.checked)}
            className="h-4 w-4 rounded border-[#2b3650]"
          />
          Notify player
        </label>
        <button
          type="button"
          disabled={saving}
          onClick={() => void saveSchoolList()}
          className="mt-3 rounded-full bg-[#52B788] px-4 py-2 text-sm font-semibold text-[#0A1628] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save school list"}
        </button>
      </div>

      {schoolListDraft.trim() ? (
        <div className="mt-4 rounded-xl border border-[#2b3650] bg-black/20 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Preview</p>
          <CoachFormattedText text={schoolListDraft} className="mt-2 text-sm text-zinc-300" />
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      {status ? <p className="mt-3 text-sm text-[#9df3bd]">{status}</p> : null}
    </section>
  );
}
