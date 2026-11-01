import type { CoachingAllowancePoolId } from "@/lib/coaching-submission-pool-shared";
import {
  formatCoachingSubmissionUsageNotice,
  formatReviewAllowanceDisplay,
} from "@/lib/coaching-submission-display-shared";
import type { ReviewAllowance } from "@/lib/access-shared";

type CoachingSubmissionUsageNoticeProps = {
  poolId: CoachingAllowancePoolId | null;
  coachingSubmissionPeriod?: string | null;
  extraReviewUseByIso?: string | null;
  fallbackCopy: ReturnType<typeof formatReviewAllowanceDisplay>;
};

export default function CoachingSubmissionUsageNotice({
  poolId,
  coachingSubmissionPeriod,
  extraReviewUseByIso,
  fallbackCopy,
}: CoachingSubmissionUsageNoticeProps) {
  const usageCopy =
    poolId != null
      ? formatCoachingSubmissionUsageNotice({
          poolId,
          coachingSubmissionPeriod,
          extraReviewUseByDate: extraReviewUseByIso ? new Date(extraReviewUseByIso) : null,
        })
      : null;
  const copy = usageCopy ?? fallbackCopy;

  return (
    <div className="mt-4 rounded-xl border border-[#2b3650] bg-black/30 px-4 py-3 text-sm text-zinc-300">
      <p>
        <span className="font-semibold text-[#9df3bd]">{copy.headline}</span>
      </p>
      {copy.detail ? <p className="mt-1 text-xs text-zinc-400">{copy.detail}</p> : null}
    </div>
  );
}

export function buildReviewAllowanceFallbackCopy(
  allowance: ReviewAllowance,
  options: {
    coreQuickReportNextEligibleAt?: Date | string | null;
    now?: Date;
  } = {},
) {
  return formatReviewAllowanceDisplay(allowance, options);
}
