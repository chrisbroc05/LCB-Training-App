import Link from "next/link";
import type { ReviewAllowance } from "@/lib/access-shared";
import type { AccessUserFields } from "@/lib/access-shared";
import { getReviewAllowance } from "@/lib/access-shared";
import { formatReviewAllowanceDisplay } from "@/lib/coaching-submission-display-shared";
import type { CoachingSubmissionUserFields } from "@/lib/coaching-submissions-shared";

type CoachingSubmissionQuotaProps = {
  user: CoachingSubmissionUserFields;
};

export default function CoachingSubmissionQuota({ user }: CoachingSubmissionQuotaProps) {
  const allowance: ReviewAllowance = getReviewAllowance(user);
  const copy = formatReviewAllowanceDisplay(allowance, {
    coreQuickReportNextEligibleAt: user.coreQuickReportNextEligibleAt,
  });

  const showProgramLink =
    allowance.kind === "playbook_lifetime" && allowance.remaining === 0;

  return (
    <div className="mt-4 rounded-xl border border-[#2b3650] bg-black/30 px-4 py-3 text-sm text-zinc-300">
      <p>
        <span className="font-semibold text-[#9df3bd]">{copy.headline}</span>
      </p>
      {copy.detail ? <p className="mt-1 text-xs text-zinc-400">{copy.detail}</p> : null}
      {showProgramLink ? (
        <Link
          href="/program"
          className="mt-2 inline-flex text-sm font-semibold text-[#98b144] transition hover:text-[#b5d84f]"
        >
          View the 12-Week Program
        </Link>
      ) : null}
    </div>
  );
}

export function CoachingSubmissionQuotaFromAccess(props: { access: AccessUserFields & CoachingSubmissionUserFields }) {
  return <CoachingSubmissionQuota user={props.access} />;
}
