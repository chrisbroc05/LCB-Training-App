"use client";

import { useState } from "react";
import MemberSubmissionVideo, { CoachResponseVideo } from "@/app/profile/MemberSubmissionVideo";
import RecommendedDrillsSection from "@/app/profile/RecommendedDrillsSection";
import WrittenPlayerReportSection from "@/app/profile/WrittenPlayerReportSection";
import { FreeMemberWhileYouWaitSection } from "@/app/components/FreeMemberWhileYouWaitCards";
import type { ProfileSubmission } from "@/app/profile/CoachingSubmissionHistory";
import {
  getProfileResponseUpsellVariant,
  type ProfileResponseUpsellVariant,
} from "@/lib/profile-coaching-upsell-shared";
import { submissionHasWrittenPlayerReport } from "@/lib/quick-written-report-shared";
import { formatDateWithYear } from "@/lib/format-date";
import type { EffectiveAccessLevel } from "@/lib/access-shared";

type ProfileSubmissionDetailPanelProps = {
  submission: ProfileSubmission;
  recommendedDrillThumbnailMap: Record<string, string | null>;
  viewerEffectiveLevel: EffectiveAccessLevel;
};

function ProfileResponseUpsell(props: { variant: ProfileResponseUpsellVariant }) {
  if (props.variant === "NONE") {
    return null;
  }

  if (props.variant === "FREE") {
    return (
      <div className="mt-4 border-t border-[#2b3650] pt-4">
        <FreeMemberWhileYouWaitSection showDashboardFooter={false} />
      </div>
    );
  }

  return (
    <p className="mt-4 border-t border-[#2b3650] pt-4 text-sm text-zinc-400">
      Want more from Coach Broc? Message him or email{" "}
      <a
        href="mailto:chrisbroc05@gmail.com"
        className="font-semibold text-[#52B788] underline-offset-2 hover:underline"
      >
        chrisbroc05@gmail.com
      </a>
      .
    </p>
  );
}

export default function ProfileSubmissionDetailPanel({
  submission,
  recommendedDrillThumbnailMap,
  viewerEffectiveLevel,
}: ProfileSubmissionDetailPanelProps) {
  const [showOriginal, setShowOriginal] = useState(false);

  const hasWrittenReport =
    submission.writtenReport &&
    submissionHasWrittenPlayerReport({
      reportStrengths: submission.writtenReport.strengths,
      evaluationPdfR2Key: submission.writtenReport.hasEvaluationPdf ? "set" : null,
    });

  const reportDateLabel = submission.respondedAt
    ? formatDateWithYear(submission.respondedAt)
    : formatDateWithYear(submission.createdAt);

  const upsellVariant = getProfileResponseUpsellVariant(viewerEffectiveLevel);

  const hideRecommendedDrillsSection = Boolean(hasWrittenReport);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#2b3650] bg-black/30 p-4">
        <p className="text-sm font-semibold text-zinc-100">From Coach Broc</p>
        {submission.status === "COMPLETED" ? (
          <div className="mt-3 space-y-3">
            {hasWrittenReport && submission.writtenReport ? (
              <WrittenPlayerReportSection
                reportTitle="Your Swing Report"
                reportDateLabel={reportDateLabel}
                strengths={submission.writtenReport.strengths}
                areasToImprove={submission.writtenReport.areasToImprove}
                recommendedDrillLines={submission.writtenReport.recommendedDrillLines}
                noteFromCoach={submission.writtenReport.noteFromCoach}
                libraryDrillIds={submission.writtenReport.libraryDrillIds}
                submissionId={submission.id}
                hasEvaluationPdf={submission.writtenReport.hasEvaluationPdf}
                drillThumbnailMap={recommendedDrillThumbnailMap}
              />
            ) : null}
            {submission.responseText && !hasWrittenReport ? (
              <p className="whitespace-pre-wrap text-sm text-zinc-300">{submission.responseText}</p>
            ) : null}
            {submission.responseVideoUrl ? (
              <CoachResponseVideo
                responseVideoUrl={submission.responseVideoUrl}
                posterR2Key={submission.responseVideoPosterR2Key}
              />
            ) : null}
            {!submission.responseText &&
            !submission.responseVideoUrl &&
            !hasWrittenReport ? (
              <p className="text-sm text-zinc-400">
                A response was marked complete with no message attached.
              </p>
            ) : null}
            {!hideRecommendedDrillsSection ? (
              <RecommendedDrillsSection
                recommendedDrillIds={submission.recommendedDrillIds}
                thumbnailMap={recommendedDrillThumbnailMap}
              />
            ) : null}
            <ProfileResponseUpsell variant={upsellVariant} />
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-300">Coach Broc typically responds within a few days.</p>
        )}
      </div>

      <div className="rounded-xl border border-[#2b3650] bg-black/30 p-4">
        <button
          type="button"
          onClick={() => setShowOriginal((value) => !value)}
          className="text-sm font-semibold text-[#52B788]"
        >
          {showOriginal ? "Hide my original submission" : "Show my original submission"}
        </button>
        {showOriginal ? (
          <div className="mt-4 space-y-3 border-t border-[#2b3650] pt-4">
            <p className="text-sm text-zinc-300">Player: {submission.playerName}</p>
            {submission.extraLines.map((line) => (
              <p key={line} className="text-sm text-zinc-300">
                {line}
              </p>
            ))}
            <p className="whitespace-pre-wrap text-sm text-zinc-300">{submission.originalMessage}</p>
            <MemberSubmissionVideo
              memberVimeoLink={submission.memberVimeoLink}
              originalVideoUrl={submission.originalVideoUrl}
              posterR2Key={submission.submittedVideoPosterR2Key}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
