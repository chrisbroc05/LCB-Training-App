import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CoachingSubmissionQuota from "@/app/CoachingSubmissionQuota";
import LockedFeaturePanel from "@/app/LockedFeaturePanel";
import SwingAnalysisForm from "@/app/swing-analysis/SwingAnalysisForm";
import {
  ensureCoachingSubmissionPeriod,
  getCoachingSubmissionAvailabilityForUser,
} from "@/lib/coaching-submissions";
import { PLAYBOOK_SUBMISSIONS_EXHAUSTED_MESSAGE } from "@/lib/coaching-submissions";
import { freeSubmissionUsedUpgradeMessage } from "@/lib/membership";

export default async function SwingAnalysisPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth");
  }

  const userFields = await ensureCoachingSubmissionPeriod(session.user.id);
  if (!userFields) {
    redirect("/auth");
  }

  const membershipTier = userFields.membershipTier;
  const availability = await getCoachingSubmissionAvailabilityForUser(session.user.id);
  const lockReason = availability?.lockReason ?? null;

  if (lockReason === "playbook-used") {
    return (
      <LockedFeaturePanel
        title="Coaching Submissions"
        description="Upload your latest swing video and include context so our coaches can provide targeted feedback."
        message={PLAYBOOK_SUBMISSIONS_EXHAUSTED_MESSAGE}
        upgradeLabel="View the 12-Week Program"
        upgradeHref="/program"
      />
    );
  }

  if (lockReason === "free-used") {
    return (
      <LockedFeaturePanel
        title="Coaching Submissions"
        description="Upload your latest swing video and include context so our coaches can provide targeted feedback."
        message={freeSubmissionUsedUpgradeMessage}
        upgradeLabel="Join the 12-Week Program"
        upgradeHref="/program"
      />
    );
  }

  if (lockReason === "pending-quick-report") {
    return (
      <LockedFeaturePanel
        title="Coaching Submissions"
        description="Upload your latest swing video and include context so our coaches can provide targeted feedback."
        message="Coach Broc is finishing your written report. You can submit again after it is sent."
        upgradeLabel="View profile"
        upgradeHref="/profile"
      />
    );
  }

  if (lockReason === "monthly-limit") {
    return (
      <LockedFeaturePanel
        title="Coaching Submissions"
        description="Upload your latest swing video and include context so our coaches can provide targeted feedback."
        message={`You have used all coaching submissions for this month. Your count resets on ${availability?.resetsOnLabel ?? "the next period"}.`}
        upgradeLabel="View Membership"
        upgradeHref="/settings"
      />
    );
  }

  if (!availability?.canSubmit) {
    redirect("/upgrade");
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">
          Coaching Submissions
        </h1>
        <p className="mt-2 text-zinc-300">
          Upload your latest swing video and include context so our coaches can provide targeted
          feedback.
        </p>

        <CoachingSubmissionQuota user={userFields} />
        <SwingAnalysisForm isFreeMember={membershipTier === "FREE"} />
      </section>
    </div>
  );
}
