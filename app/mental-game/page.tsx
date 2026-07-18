import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CoachingSubmissionQuota from "@/app/CoachingSubmissionQuota";
import LockedFeaturePanel from "@/app/LockedFeaturePanel";
import MentalGameForm from "@/app/mental-game/MentalGameForm";
import {
  ensureCoachingSubmissionPeriod,
  getCoachingSubmissionAvailability,
  getCoachingSubmissionLockReason,
} from "@/lib/coaching-submissions";

export default async function MentalGamePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth");
  }

  const userFields = await ensureCoachingSubmissionPeriod(session.user.id);
  if (!userFields) {
    redirect("/auth");
  }

  const membershipTier = userFields.membershipTier;
  const lockReason = getCoachingSubmissionLockReason(userFields);

  if (membershipTier === "BASIC" || lockReason === "basic") {
    return (
      <LockedFeaturePanel
        title="Coaching Submissions"
        description="Submit what you are dealing with mentally so your coach can send support and adjustments."
        message="Coaching submissions are available on Memorable and Elite memberships. Upgrade to Memorable for 1-on-1 coaching, monthly swing analysis and mental game support submissions, and accountability support."
        upgradeLabel="Upgrade to Memorable"
        upgradeHref="/upgrade?reason=memorable-required"
      />
    );
  }

  const availability = getCoachingSubmissionAvailability(userFields);

  if (lockReason === "free-used") {
    return (
      <LockedFeaturePanel
        title="Coaching Submissions"
        description="Submit what you are dealing with mentally so your coach can send support and adjustments."
        message="Your one free submission has already been used. Upgrade to Memorable or Elite for 1-on-1 coaching, monthly swing analysis and mental game support submissions, and accountability support."
        upgradeLabel="Upgrade to Memorable or Elite"
        upgradeHref="/upgrade?reason=free-submission-used"
      />
    );
  }

  if (lockReason === "monthly-limit") {
    return (
      <LockedFeaturePanel
        title="Coaching Submissions"
        description="Submit what you are dealing with mentally so your coach can send support and adjustments."
        message={`You have used all coaching submissions for this month. Your count resets on ${availability.resetsOnLabel}.`}
        upgradeLabel={
          membershipTier === "MEMORABLE" ? "Upgrade to Elite for More" : "View Membership"
        }
        upgradeHref={
          membershipTier === "MEMORABLE" ? "/upgrade?reason=memorable-required" : "/settings"
        }
      />
    );
  }

  if (!availability.canSubmit) {
    redirect("/upgrade");
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">
          Coaching Submissions
        </h1>
        <p className="mt-2 text-zinc-300">
          Submit what you are dealing with mentally so your coach can send support and adjustments.
        </p>

        <CoachingSubmissionQuota availability={availability} membershipTier={membershipTier} />
        <MentalGameForm />
      </section>
    </div>
  );
}
