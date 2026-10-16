import Link from "next/link";
import type { CoachingSubmissionAvailability } from "@/lib/coaching-submissions";
import {
  formatPlaybookSubmissionQuotaLabel,
  getCoachingSubmissionPeriodLabel,
  PLAYBOOK_LIFETIME_SUBMISSION_LIMIT,
  PLAYBOOK_SUBMISSIONS_EXHAUSTED_MESSAGE,
} from "@/lib/coaching-submissions";
import type { DatabaseTier } from "@/lib/membership";

type CoachingSubmissionQuotaProps = {
  availability: CoachingSubmissionAvailability;
  membershipTier: DatabaseTier;
};

export default function CoachingSubmissionQuota({
  availability,
  membershipTier,
}: CoachingSubmissionQuotaProps) {
  if (membershipTier === "BASIC") {
    const limit = availability.lifetimeLimit ?? PLAYBOOK_LIFETIME_SUBMISSION_LIMIT;
    return (
      <div className="mt-4 rounded-xl border border-[#2b3650] bg-black/30 px-4 py-3 text-sm text-zinc-300">
        {availability.remaining > 0 ? (
          <p>
            <span className="font-semibold text-[#9df3bd]">
              {formatPlaybookSubmissionQuotaLabel(availability.remaining, limit)}
            </span>{" "}
            (swing video or mindset support).
          </p>
        ) : (
          <>
            <p>{PLAYBOOK_SUBMISSIONS_EXHAUSTED_MESSAGE}</p>
            <Link
              href="/program"
              className="mt-2 inline-flex text-sm font-semibold text-[#98b144] transition hover:text-[#b5d84f]"
            >
              View the 12-Week Program
            </Link>
          </>
        )}
      </div>
    );
  }

  if (membershipTier === "FREE") {
    return (
      <div className="mt-4 rounded-xl border border-[#2b3650] bg-black/30 px-4 py-3 text-sm text-zinc-300">
        {availability.remaining > 0 ? (
          <p>
            <span className="font-semibold text-[#9df3bd]">1 free submission</span> remaining -
            use it anytime for swing video or mindset support.
          </p>
        ) : (
          <p>You have used your one free coaching submission.</p>
        )}
      </div>
    );
  }

  if (membershipTier === "TWELVE_WEEK") {
    return (
      <div className="mt-4 rounded-xl border border-[#52B788]/30 bg-[#22c55e]/5 px-4 py-3 text-sm text-zinc-300">
        <p>
          <span className="font-semibold text-[#9df3bd]">Unlimited coaching submissions</span>{" "}
          included with your 12-Week Program.
        </p>
      </div>
    );
  }

  if (membershipTier === "MEMORABLE") {
    return (
      <div className="mt-4 rounded-xl border border-[#2b3650] bg-black/30 px-4 py-3 text-sm text-zinc-300">
        <p>
          <span className="font-semibold text-[#9df3bd]">
            {availability.remaining} of {availability.monthlyLimit}
          </span>{" "}
          coaching submissions remaining for {getCoachingSubmissionPeriodLabel(availability.periodKey)}.
        </p>
        <p className="mt-1 text-xs text-zinc-400">Resets on {availability.resetsOnLabel}.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-[#2b3650] bg-black/30 px-4 py-3 text-sm text-zinc-300">
      <p>
        <span className="font-semibold text-[#9df3bd]">{availability.remaining}</span> coaching
        submission{availability.remaining === 1 ? "" : "s"} remaining for{" "}
        {getCoachingSubmissionPeriodLabel(availability.periodKey)}.
      </p>
      <p className="mt-1 text-xs text-zinc-400">
        {availability.monthlyRemaining} monthly
        {availability.rolloverCredits
          ? ` + ${availability.rolloverCredits} rollover credit${availability.rolloverCredits === 1 ? "" : "s"}`
          : ""}
        {" - "}Resets on {availability.resetsOnLabel}.
      </p>
    </div>
  );
}
