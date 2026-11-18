"use client";

import CoachFormattedText from "@/components/CoachFormattedText";
import {
  labelForRecruitingLocation,
  labelForRecruitingScholarship,
  labelForRecruitingSchoolSize,
  type RecruitingProfileView,
} from "@/lib/recruiting-shared";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-sm text-zinc-200">{value || "--"}</p>
    </div>
  );
}

export default function ParentRecruitingSection({
  profile,
}: {
  profile: RecruitingProfileView | null;
}) {
  if (!profile || (!profile.enabled && !profile.coachSchoolList?.trim())) {
    return null;
  }

  return (
    <section className="mt-8 rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-6">
      <h2 className="text-xl font-semibold text-zinc-100">Recruiting</h2>
      <p className="mt-2 text-sm text-zinc-400">Read-only view of recruiting answers and school list.</p>

      {profile.enabled ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Row
            label="Grad year"
            value={profile.gradYear != null ? String(profile.gradYear) : ""}
          />
          <Row label="Primary position" value={profile.primaryPosition ?? ""} />
          <Row label="Secondary position" value={profile.secondaryPosition ?? ""} />
          <Row
            label="Levels open to"
            value={profile.levelsOpenTo.length > 0 ? profile.levelsOpenTo.join(", ") : ""}
          />
          <Row
            label="Location"
            value={labelForRecruitingLocation(profile.locationPreference)}
          />
          <Row label="School size" value={labelForRecruitingSchoolSize(profile.schoolSize)} />
          <Row label="Major / study" value={profile.majorOrStudy ?? ""} />
          <Row label="GPA range" value={profile.gpaRange ?? ""} />
          <Row
            label="Scholarship"
            value={labelForRecruitingScholarship(profile.scholarshipImportance)}
          />
          <Row label="Video link" value={profile.videoUrl ?? ""} />
          <div className="sm:col-span-2">
            <Row label="Notes for Coach Broc" value={profile.notesForCoach ?? ""} />
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-400">Recruiting help is currently off.</p>
      )}

      {profile.coachSchoolList?.trim() ? (
        <div className="mt-6 rounded-xl border border-[#52B788]/30 bg-[#52B788]/5 p-4">
          <p className="text-sm font-semibold text-zinc-100">Coach Broc&apos;s school list</p>
          <CoachFormattedText
            text={profile.coachSchoolList}
            className="mt-3 text-sm text-zinc-300"
          />
        </div>
      ) : null}
    </section>
  );
}
