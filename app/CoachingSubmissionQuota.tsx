import type { CoachingSubmissionAvailability } from "@/lib/coaching-submissions";
import { getCoachingSubmissionPeriodLabel } from "@/lib/coaching-submissions";

type CoachingSubmissionQuotaProps = {
  availability: CoachingSubmissionAvailability;
  membershipTier: "FREE" | "BASIC" | "MEMORABLE" | "ELITE";
};

export default function CoachingSubmissionQuota({
  availability,
  membershipTier,
}: CoachingSubmissionQuotaProps) {
  if (membershipTier === "BASIC") {
    return null;
  }

  if (membershipTier === "FREE") {
    return (
      <div className="mt-4 rounded-xl border border-[#2b3650] bg-black/30 px-4 py-3 text-sm text-zinc-300">
        {availability.remaining > 0 ? (
          <p>
            <span className="font-semibold text-[#9df3bd]">1 free submission</span> remaining ù use
            it anytime for swing video or mindset support.
          </p>
        ) : (
          <p>You have used your one free coaching submission.</p>
        )}
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
        {" ù "}Resets on {availability.resetsOnLabel}.
      </p>
    </div>
  );
}
