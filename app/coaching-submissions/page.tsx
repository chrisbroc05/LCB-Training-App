import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CoachingSubmissionsHub from "@/app/coaching-submissions/CoachingSubmissionsHub";
import FreeSwingWelcomeBanner from "@/app/coaching-submissions/FreeSwingWelcomeBanner";
import LockedFeaturePanel from "@/app/LockedFeaturePanel";
import {
  ensureCoachingSubmissionPeriod,
  getCoachingSubmissionAvailability,
  getCoachingSubmissionLockReason,
} from "@/lib/coaching-submissions";
import { PLAYBOOK_SUBMISSIONS_EXHAUSTED_MESSAGE } from "@/lib/coaching-submissions";
import {
  canAccessCoachingNav,
  getCoachingResponseTimeLabel,
  freeSubmissionUsedUpgradeMessage,
} from "@/lib/membership";
import { listCoachingAllowanceSummaryOptions } from "@/lib/coaching-submission-pool-shared";
import { resolveEffectiveLevel } from "@/lib/access-shared";

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
  const effective = resolveEffectiveLevel(userFields);

  if (lockReason === "playbook-used" && effective === "PLAYBOOK") {
    return (
      <LockedFeaturePanel
        title="Coaching Submissions"
        description="Submit swing videos and mindset questions for personalized feedback from Coach Broc."
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
        description="Submit swing videos and mindset questions for personalized feedback from Coach Broc."
        message={freeSubmissionUsedUpgradeMessage}
        upgradeLabel="Join the 12-Week Program"
        upgradeHref="/program"
      />
    );
  }

  if (lockReason === "monthly-limit") {
    return (
      <LockedFeaturePanel
        title="Coaching Submissions"
        description="Submit swing videos and mindset questions for personalized feedback from Coach Broc."
        message={`You have used all coaching submissions for this month. Your count resets on ${availability.resetsOnLabel}.`}
        upgradeLabel="View Membership"
        upgradeHref="/settings"
      />
    );
  }

  const summaryOptions = listCoachingAllowanceSummaryOptions(userFields);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <FreeSwingWelcomeBanner />
      <CoachingSubmissionsHub
        summaryOptions={summaryOptions}
        responseTimeLabel={getCoachingResponseTimeLabel(membershipTier)}
        showHistoryLink={canAccessCoachingNav(membershipTier) || membershipTier === "BASIC"}
      />
    </div>
  );
}
