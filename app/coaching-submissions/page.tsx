import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CoachingSubmissionQuota from "@/app/CoachingSubmissionQuota";
import LockedFeaturePanel from "@/app/LockedFeaturePanel";
import {
  ensureCoachingSubmissionPeriod,
  getCoachingSubmissionAvailability,
  getCoachingSubmissionLockReason,
} from "@/lib/coaching-submissions";
import { canAccessCoachingNav, getCoachingResponseTimeLabel, memorableRequiredMessage, freeSubmissionUsedUpgradeMessage, type DatabaseTier } from "@/lib/membership";

export default async function CoachingSubmissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth");
  }

  const userFields = await ensureCoachingSubmissionPeriod(session.user.id);
  if (!userFields) {
    redirect("/auth");
  }

  const membershipTier = userFields.membershipTier;
  const availability = getCoachingSubmissionAvailability(userFields);
  const lockReason = getCoachingSubmissionLockReason(userFields);

  if (membershipTier === "BASIC") {
    return (
      <LockedFeaturePanel
        title="Coaching Submissions"
        description="Submit swing videos and mindset questions for personalized feedback from Coach Broc."
        message={memorableRequiredMessage}
        upgradeLabel="Upgrade to Memorable"
        upgradeHref="/upgrade?reason=memorable-required"
      />
    );
  }

  if (lockReason === "free-used") {
    return (
      <LockedFeaturePanel
        title="Coaching Submissions"
        description="Submit swing videos and mindset questions for personalized feedback from Coach Broc."
        message={freeSubmissionUsedUpgradeMessage}
        upgradeLabel="Upgrade to Memorable or Elite"
        upgradeHref="/upgrade?reason=free-submission-used"
      />
    );
  }

  if (lockReason === "monthly-limit") {
    return (
      <LockedFeaturePanel
        title="Coaching Submissions"
        description="Submit swing videos and mindset questions for personalized feedback from Coach Broc."
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

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">
          Coaching Submissions
        </h1>
        <p className="mt-2 text-zinc-300">
          Choose the type of coaching support you need. Coach Broc typically responds within{" "}
          {getCoachingResponseTimeLabel(membershipTier)}.
        </p>

        <CoachingSubmissionQuota availability={availability} membershipTier={membershipTier} />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-[#2b3650] bg-black/30 p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-zinc-100">Swing Video Feedback</h2>
            <p className="mt-2 text-sm text-zinc-300">
              Upload a swing video with context so Coach Broc can provide targeted mechanical
              feedback.
            </p>
            <Link
              href="/swing-analysis"
              className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
            >
              Submit Swing Video
            </Link>
          </article>

          <article className="rounded-xl border border-[#2b3650] bg-black/30 p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-zinc-100">Mindset Support</h2>
            <p className="mt-2 text-sm text-zinc-300">
              Share what you are working through mentally for guidance on confidence, focus, and
              composure.
            </p>
            <Link
              href="/mental-game"
              className="mt-4 inline-flex rounded-full border border-[#22c55e]/70 bg-[#22c55e]/10 px-4 py-2 text-sm font-semibold text-[#9df3bd] transition hover:bg-[#22c55e]/20"
            >
              Submit Mindset Request
            </Link>
          </article>
        </div>

        {canAccessCoachingNav(membershipTier) ? (
          <Link
            href="/profile"
            className="mt-6 inline-flex text-sm font-medium text-[#98b144] transition hover:text-[#b5d84f]"
          >
            View submission history ?
          </Link>
        ) : null}
      </section>
    </div>
  );
}
