import Link from "next/link";
import ProfileCard from "@/app/profile/ProfileCard";
import ProfileSubmissionDetailPanel from "@/app/profile/ProfileSubmissionDetailPanel";
import { formatDateTime } from "@/lib/format-date";
import type { EffectiveAccessLevel } from "@/lib/access-shared";

type SubmissionStatus = "PENDING" | "REVIEWING" | "COMPLETED";
type SubmissionType = "SWING" | "MENTAL";

export type ProfileSubmission = {
  id: string;
  type: SubmissionType;
  createdAt: Date;
  respondedAt: Date | null;
  status: SubmissionStatus;
  playerName: string;
  originalMessage: string;
  originalVideoUrl: string | null;
  submittedVideoPosterR2Key: string | null;
  memberVimeoLink: string | null;
  responseText: string | null;
  responseVideoUrl: string | null;
  responseVideoPosterR2Key: string | null;
  recommendedDrillIds: string[];
  extraLines: string[];
  writtenReport?: {
    strengths: string[];
    areasToImprove: string[];
    recommendedDrillLines: string[];
    noteFromCoach: string | null;
    libraryDrillIds: string[];
    hasEvaluationPdf: boolean;
  } | null;
};

type CoachingSubmissionHistoryProps = {
  submissions: ProfileSubmission[];
  selectedSubmission: ProfileSubmission | null;
  recommendedDrillThumbnailMap: Record<string, string | null>;
  viewerEffectiveLevel: EffectiveAccessLevel;
};

export default function CoachingSubmissionHistory({
  submissions,
  selectedSubmission,
  recommendedDrillThumbnailMap,
  viewerEffectiveLevel,
}: CoachingSubmissionHistoryProps) {
  return (
    <ProfileCard title="Coaching Submission History">
      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div>
          {submissions.length === 0 ? (
            <p className="text-sm text-zinc-400">You have not submitted any requests yet.</p>
          ) : (
            <div className="space-y-3">
              {submissions.map((submission) => {
                const statusLabel =
                  submission.status === "COMPLETED" ? "Responded" : "Pending Review";
                const isSelected =
                  selectedSubmission?.id === submission.id &&
                  selectedSubmission?.type === submission.type;

                return (
                  <Link
                    key={`${submission.type}-${submission.id}`}
                    href={`/profile?type=${submission.type.toLowerCase()}&id=${submission.id}`}
                    className={`block rounded-xl border p-4 transition ${
                      isSelected
                        ? "border-[#22c55e]/60 bg-[#22c55e]/10"
                        : "border-[#2b3650] bg-black/30 hover:border-[#3c4a68]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-100">Coaching Submissions</p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                          submission.status === "COMPLETED"
                            ? "bg-[#22c55e]/20 text-[#9df3bd]"
                            : "bg-[#24314a] text-zinc-200"
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-zinc-400">{formatDateTime(submission.createdAt)}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div>
          {!selectedSubmission ? (
            <p className="text-sm text-zinc-400">Select a submission to view details.</p>
          ) : (
            <ProfileSubmissionDetailPanel
              submission={selectedSubmission}
              recommendedDrillThumbnailMap={recommendedDrillThumbnailMap}
              viewerEffectiveLevel={viewerEffectiveLevel}
            />
          )}
        </div>
      </div>
    </ProfileCard>
  );
}
