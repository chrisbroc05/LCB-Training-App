import Link from "next/link";
import FreeMemberWhileYouWaitCards from "@/app/components/FreeMemberWhileYouWaitCards";
import KeepBuildingSwingCard from "@/app/components/KeepBuildingSwingCard";
import CoachingAllowanceList from "@/app/dashboard/CoachingAllowanceList";
import type { KeepBuildingCoachingContext } from "@/lib/coaching-keep-building-shared";
import type { CoachingSubmissionAvailability, CoachingSubmissionUserFields } from "@/lib/coaching-submissions-shared";
import {
  coachingAllowanceLinesCanSubmitAny,
  listCoachingAllowanceLines,
} from "@/lib/coaching-allowance-lines-shared";
import { resolveEffectiveLevel, type AccessUserFields } from "@/lib/access-shared";
import { formatAssessmentCallDateTime } from "@/lib/assessment-call";
import { COACH_CALENDLY_URL } from "@/lib/coach-calendly-shared";
import { canAccessCoachingNav, type DatabaseTier } from "@/lib/membership";
import { isPublicMembershipLevelsEnabled } from "@/lib/membership-levels-shared";

type DashboardCoachingCardProps = {
  membershipTier: DatabaseTier;
  access: AccessUserFields;
  coachingUser: CoachingSubmissionUserFields | null;
  coachingAvailability: CoachingSubmissionAvailability | null;
  freeSubmissionUsed: boolean;
  assessmentCallBooked: boolean;
  assessmentCallDate: Date | null;
  keepBuildingCoaching?: KeepBuildingCoachingContext | null;
};

export default function DashboardCoachingCard({
  membershipTier,
  access,
  coachingUser,
  coachingAvailability,
  freeSubmissionUsed,
  assessmentCallBooked,
  assessmentCallDate,
  keepBuildingCoaching = null,
}: DashboardCoachingCardProps) {
  if (keepBuildingCoaching) {
    return <KeepBuildingSwingCard context={keepBuildingCoaching} />;
  }

  const coachingFields = coachingUser ? { ...access, ...coachingUser } : null;
  const allowanceLines = coachingFields ? listCoachingAllowanceLines(coachingFields) : [];
  const canSubmitFromLines = coachingAllowanceLinesCanSubmitAny(allowanceLines);
  const canSubmit =
    canSubmitFromLines || Boolean(coachingAvailability?.canSubmit && allowanceLines.length === 0);

  if (coachingFields && allowanceLines.length > 0) {
    return (
      <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-100">Coaching Submissions</h2>
        {allowanceLines.length >= 2 ? (
          <p className="mt-2 text-xs text-zinc-500">You have two ways to get feedback from me:</p>
        ) : null}
        <CoachingAllowanceList user={coachingFields} />
        {canSubmit ? (
          <Link
            href="/coaching-submissions"
            className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
          >
            Go to Coaching Submissions
          </Link>
        ) : (
          <Link
            href="/program"
            className="mt-4 inline-flex rounded-full border border-[#2b3650] bg-black/40 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-[#7f9434] hover:text-[#98b144]"
          >
            Explore the 12-Week Program
          </Link>
        )}
      </article>
    );
  }

  if (canAccessCoachingNav(membershipTier) && membershipTier !== "FREE") {
    return (
      <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-100">Coaching Submissions</h2>
        {coachingAvailability && coachingAvailability.canSubmit ? (
          <Link
            href="/coaching-submissions"
            className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
          >
            Go to Coaching Submissions
          </Link>
        ) : (
          <Link
            href="/settings"
            className="mt-4 inline-flex rounded-full border border-[#2b3650] bg-black/40 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-[#7f9434] hover:text-[#98b144]"
          >
            View membership details
          </Link>
        )}
      </article>
    );
  }

  const effective = coachingUser ? resolveEffectiveLevel({ ...access, ...coachingUser }) : "FREE";

  if (effective === "FREE" && membershipTier === "FREE") {
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
          {coachingFields ? <CoachingAllowanceList user={coachingFields} /> : null}
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
                Your submission has been sent. Coach Broc will be in touch within a few days.
              </p>
              <p className="mt-3 text-sm text-zinc-300">
                Want more coaching support? See the 12-Week Coaching Program
                {isPublicMembershipLevelsEnabled() ? " or membership levels" : ""}.
              </p>
              <div className="mt-6 space-y-4">
                <p className="text-sm font-medium text-zinc-200">
                  While you wait -- here is what else is waiting for you.
                </p>
                <FreeMemberWhileYouWaitCards />
              </div>
            </>
          )}
        </article>

        {assessmentCallBooked && assessmentCallDate ? (
          <article className="rounded-2xl border border-[#22c55e]/40 bg-[#0A1628] p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-zinc-100">Your Call is Scheduled</h2>
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
            <h2 className="text-lg font-semibold text-zinc-100">Have questions?</h2>
            <p className="mt-3 text-sm text-zinc-300">
              Want to talk through the 12-Week Program first? Book a call with me.
            </p>
            <a
              href={COACH_CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
            >
              Book a call
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
        Join the 12-Week Coaching Program for a daily plan, weekly video breakdowns, and direct
        messaging with Coach Broc.
      </p>
      <Link
        href="/program"
        className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
      >
        Join the 12-Week Program
      </Link>
    </article>
  );
}
