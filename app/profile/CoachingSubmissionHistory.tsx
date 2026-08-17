import Link from "next/link";
import ProfileCard from "@/app/profile/ProfileCard";
import MemberSubmissionVideo from "@/app/profile/MemberSubmissionVideo";
import { toVimeoEmbedUrl } from "@/lib/vimeo";

type SubmissionStatus = "PENDING" | "REVIEWING" | "COMPLETED";
type SubmissionType = "SWING" | "MENTAL";

export type ProfileSubmission = {
  id: string;
  type: SubmissionType;
  createdAt: Date;
  status: SubmissionStatus;
  playerName: string;
  originalMessage: string;
  originalVideoUrl: string | null;
  memberVimeoLink: string | null;
  responseText: string | null;
  responseVideoUrl: string | null;
  extraLines: string[];
};

type CoachingSubmissionHistoryProps = {
  submissions: ProfileSubmission[];
  selectedSubmission: ProfileSubmission | null;
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function CoachingSubmissionHistory({
  submissions,
  selectedSubmission,
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
            <div className="space-y-5">
              <div className="rounded-xl border border-[#2b3650] bg-black/30 p-4">
                <p className="text-sm font-semibold text-zinc-100">Original Submission</p>
                <p className="mt-2 text-sm text-zinc-300">Player: {selectedSubmission.playerName}</p>
                {selectedSubmission.extraLines.map((line) => (
                  <p key={line} className="mt-1 text-sm text-zinc-300">
                    {line}
                  </p>
                ))}
                <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-300">
                  {selectedSubmission.originalMessage}
                </p>
                <div className="mt-4 space-y-2">
                  <MemberSubmissionVideo
                    memberVimeoLink={selectedSubmission.memberVimeoLink}
                    originalVideoUrl={selectedSubmission.originalVideoUrl}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#2b3650] bg-black/30 p-4">
                <p className="text-sm font-semibold text-zinc-100">Coach Chris Response</p>
                {selectedSubmission.status === "COMPLETED" ? (
                  <div className="mt-3 space-y-3">
                    {selectedSubmission.responseText ? (
                      <p className="whitespace-pre-wrap text-sm text-zinc-300">
                        {selectedSubmission.responseText}
                      </p>
                    ) : null}
                    {selectedSubmission.responseVideoUrl ? (
                      <>
                        <a
                          href={selectedSubmission.responseVideoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#8fd7ff] underline"
                        >
                          View Coach Video Response
                        </a>
                        {toVimeoEmbedUrl(selectedSubmission.responseVideoUrl) ? (
                          <div className="relative w-full overflow-hidden rounded-xl border border-[#2b3650] pt-[56.25%]">
                            <iframe
                              src={toVimeoEmbedUrl(selectedSubmission.responseVideoUrl) ?? undefined}
                              title="Coach response video"
                              className="absolute inset-0 h-full w-full"
                              allow="autoplay; fullscreen; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        ) : null}
                      </>
                    ) : null}
                    {!selectedSubmission.responseText && !selectedSubmission.responseVideoUrl ? (
                      <p className="text-sm text-zinc-400">
                        A response was marked complete with no message attached.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-zinc-300">
                    Coach Chris typically responds within 48 hours.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProfileCard>
  );
}
