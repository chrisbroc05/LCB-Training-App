import Link from "next/link";
import type { CoachingSubmissionAvailability } from "@/lib/coaching-submissions";
import type { DatabaseTier } from "@/lib/membership";

type UnreadResponseNotification = {
  id: number;
  title: string;
  linkUrl: string | null;
};

type MobileCoachingStatusCardProps = {
  membershipTier: DatabaseTier;
  coachingAvailability: CoachingSubmissionAvailability | null;
  freeSubmissionUsed: boolean;
  unreadResponse: UnreadResponseNotification | null;
};

export default function MobileCoachingStatusCard({
  membershipTier,
  coachingAvailability,
  freeSubmissionUsed,
  unreadResponse,
}: MobileCoachingStatusCardProps) {
  if (unreadResponse) {
    return (
      <article className="mobile-card border-[#22c55e]/50 bg-[#22c55e]/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">
          New Response
        </p>
        <h2 className="mt-2 text-lg font-semibold text-zinc-100">Coach Broc responded</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Your latest coaching feedback is ready to review.
        </p>
        <Link
          href={unreadResponse.linkUrl ?? "/profile"}
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#22c55e] px-4 text-sm font-semibold text-black"
        >
          View Response
        </Link>
      </article>
    );
  }

  if (membershipTier === "BASIC") {
    return (
      <article className="mobile-card">
        <h2 className="text-lg font-semibold text-zinc-100">Coaching Submissions</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Upgrade to Memorable for monthly coaching submissions and personal feedback from Coach
          Broc.
        </p>
        <Link
          href="/upgrade?reason=memorable-required"
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#22c55e] px-4 text-sm font-semibold text-black"
        >
          Upgrade to Memorable
        </Link>
      </article>
    );
  }

  if (membershipTier === "FREE") {
    if (!freeSubmissionUsed) {
      return (
        <article className="mobile-card border-[#22c55e]/40 bg-[#22c55e]/10">
          <h2 className="text-lg font-semibold text-zinc-100">Coaching Submissions</h2>
          <p className="mt-2 text-sm text-zinc-300">
            You have <span className="font-semibold text-[#9df3bd]">1 free submission</span>{" "}
            remaining.
          </p>
          <Link
            href="/coaching-submissions"
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#22c55e] px-4 text-sm font-semibold text-black"
          >
            Submit Now
          </Link>
        </article>
      );
    }

    return (
      <article className="mobile-card">
        <h2 className="text-lg font-semibold text-zinc-100">Coaching Submissions</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Your free submission has been used. Upgrade to Memorable for monthly coaching feedback.
        </p>
        <Link
          href="/upgrade?reason=memorable-required"
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full border border-[#2b3650] px-4 text-sm font-semibold text-zinc-200"
        >
          Upgrade to Memorable
        </Link>
      </article>
    );
  }

  if (coachingAvailability?.canSubmit) {
    return (
      <article className="mobile-card border-[#22c55e]/40 bg-[#22c55e]/10">
        <h2 className="text-lg font-semibold text-zinc-100">Coaching Submissions</h2>
        <p className="mt-2 text-sm text-zinc-300">
          You have{" "}
          <span className="font-semibold text-[#9df3bd]">
            {coachingAvailability.remaining} submission
            {coachingAvailability.remaining === 1 ? "" : "s"}
          </span>{" "}
          remaining this month.
        </p>
        <Link
          href="/coaching-submissions"
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#22c55e] px-4 text-sm font-semibold text-black"
        >
          Submit Now
        </Link>
      </article>
    );
  }

  return (
    <article className="mobile-card">
      <h2 className="text-lg font-semibold text-zinc-100">Coaching Submissions</h2>
      <p className="mt-2 text-sm text-zinc-300">
        No submissions remaining for this period.
      </p>
      {coachingAvailability ? (
        <p className="mt-2 text-xs text-zinc-400">
          Resets on {coachingAvailability.resetsOnLabel}.
          {membershipTier === "ELITE"
            ? ` Rollover credits: ${coachingAvailability.rolloverCredits ?? 0}.`
            : null}
        </p>
      ) : null}
      <Link
        href={membershipTier === "MEMORABLE" ? "/upgrade" : "/settings"}
        className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full border border-[#2b3650] px-4 text-sm font-semibold text-zinc-200"
      >
        {membershipTier === "MEMORABLE" ? "Upgrade for more submissions" : "View membership"}
      </Link>
    </article>
  );
}
