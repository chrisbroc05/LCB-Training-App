import Link from "next/link";
import FreeMemberWhileYouWaitCards from "@/app/components/FreeMemberWhileYouWaitCards";
import { memorableUpgradePitch } from "@/lib/membership";
import CoachingSubmissionQuota from "@/app/CoachingSubmissionQuota";
import type { CoachingSubmissionAvailability } from "@/lib/coaching-submissions";
import { formatAssessmentCallDateTime } from "@/lib/assessment-call";
import type { DatabaseTier } from "@/lib/membership";

type DashboardCoachingCardProps = {
  membershipTier: DatabaseTier;
  coachingAvailability: CoachingSubmissionAvailability | null;
  freeSubmissionUsed: boolean;
  assessmentCallBooked: boolean;
  assessmentCallDate: Date | null;
};

export default function DashboardCoachingCard({
  membershipTier,
  coachingAvailability,
  freeSubmissionUsed,
  assessmentCallBooked,
  assessmentCallDate,
}: DashboardCoachingCardProps) {
  if (membershipTier === "MEMORABLE" || membershipTier === "ELITE") {
    return (
      <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-100">Coaching Submissions</h2>
        {coachingAvailability ? (
          <div className="mt-3">
            <CoachingSubmissionQuota
              availability={coachingAvailability}
              membershipTier={membershipTier}
            />
          </div>
        ) : null}
        {coachingAvailability && coachingAvailability.canSubmit ? (
          <Link
            href="/coaching-submissions"
            className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
          >
            Go to Coaching Submissions
          </Link>
        ) : (
          <Link
            href={membershipTier === "MEMORABLE" ? "/upgrade" : "/settings"}
            className="mt-4 inline-flex rounded-full border border-[#2b3650] bg-black/40 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-[#7f9434] hover:text-[#98b144]"
          >
            {membershipTier === "MEMORABLE"
              ? "Upgrade for more submissions"
              : "View membership details"}
          </Link>
        )}
      </article>
    );
  }

  if (membershipTier === "FREE") {
    return (
      <div className="space-y-4 sm:space-y-5">
        <article
          className={`rounded-2xl border p-4 sm:p-6 ${
            !freeSubmissionUsed
              ? "border-[#22c55e]/50 bg-[#22c55e]/10"
              : "border-[#18243a] bg-[#0b1324]/80"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-100">Coaching Submissions</h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                !freeSubmissionUsed
                  ? "bg-[#22c55e]/20 text-[#9df3bd]"
                  : "bg-[#24314a] text-zinc-200"
              }`}
            >
              {!freeSubmissionUsed ? "Available" : "Used"}
            </span>
          </div>
          {coachingAvailability && !freeSubmissionUsed ? (
            <div className="mt-3">
              <CoachingSubmissionQuota
                availability={coachingAvailability}
                membershipTier={membershipTier}
              />
            </div>
          ) : !freeSubmissionUsed ? (
            <p className="mt-3 text-sm text-zinc-300">
              Free members can submit one coaching submission.
            </p>
          ) : null}
          {!freeSubmissionUsed ? (
            <Link
              href="/coaching-submissions"
              className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
            >
              Submit Coaching Submission
            </Link>
          ) : (
            <>
              <p className="mt-3 text-sm text-zinc-300">
                Your submission has been sent. Coach Broc will be in touch within 48 hours.
              </p>
              <p className="mt-3 text-sm text-zinc-300">
                Want unlimited coaching submissions and personal feedback every month? Upgrade to
                Memorable.
              </p>
              <div className="mt-6 space-y-4">
                <p className="text-sm font-medium text-zinc-200">
                  While you wait -- here is what else is waiting for you.
                </p>
                <FreeMemberWhileYouWaitCards usePlaybookCheckout />
              </div>
            </>
          )}
        </article>

        {assessmentCallBooked && assessmentCallDate ? (
          <article className="rounded-2xl border border-[#22c55e]/40 bg-[#0A1628] p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-zinc-100">
                Your Assessment Call is Scheduled
              </h2>
              <span className="rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">
                Scheduled
              </span>
            </div>
            <p className="mt-3 text-base font-medium text-[#9df3bd]">
              {formatAssessmentCallDateTime(assessmentCallDate)}
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              Google Meet link will be in your Calendly confirmation email
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              Need to reschedule or cancel? Use the link provided in your Calendly confirmation
              email
            </p>
          </article>
        ) : (
          <article className="rounded-2xl border border-[#22c55e]/50 bg-[#22c55e]/10 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-zinc-100">Free Player Assessment Call</h2>
              <span className="rounded-full bg-[#22c55e]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">
                Free
              </span>
            </div>
            <p className="mt-3 text-sm text-zinc-300">
              Book a free 20-minute video call with Coach Broc to discuss your player&apos;s goals
              and find the right training plan for their development.
            </p>
            <a
              href="https://calendly.com/chrisbroc05/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
            >
              Book Your Free Call
            </a>
          </article>
        )}
      </div>
    );
  }

  return (
    <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-100">Coaching Submissions</h2>
      <p className="mt-3 text-sm text-zinc-300">
        Upgrade to Memorable for {memorableUpgradePitch}
      </p>
      <Link
        href="/upgrade?reason=memorable-required"
        className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
      >
        Upgrade to Memorable
      </Link>
    </article>
  );
}
