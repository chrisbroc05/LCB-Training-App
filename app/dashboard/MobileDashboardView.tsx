import DashboardPlaybookProgressCard from "@/app/dashboard/DashboardPlaybookProgressCard";
import DashboardUpgradeSection from "@/app/dashboard/DashboardUpgradeSection";
import MobileCoachingStatusCard from "@/app/dashboard/MobileCoachingStatusCard";
import MonthlyGoalProgressCard from "@/app/dashboard/MonthlyGoalProgressCard";
import type { CoachingSubmissionAvailability } from "@/lib/coaching-submissions";
import { canAccessCoachingNav, type DatabaseTier } from "@/lib/membership";

type UnreadResponseNotification = {
  id: number;
  title: string;
  linkUrl: string | null;
};

type MobileDashboardViewProps = {
  userId: string;
  membershipTier: DatabaseTier;
  coachingAvailability: CoachingSubmissionAvailability | null;
  freeSubmissionUsed: boolean;
  currentMonthGoalCheckin: {
    goals: Array<{
      id: number;
      category: string;
      description: string;
      targetValue: string | null;
      completed: boolean;
      completedAt: Date | null;
    }>;
  } | null;
  checkoutStatus: string | null;
  upgradeStatus: string | null;
  hasSubscription: boolean;
  unreadResponse: UnreadResponseNotification | null;
};

export default function MobileDashboardView({
  userId,
  membershipTier,
  coachingAvailability,
  freeSubmissionUsed,
  currentMonthGoalCheckin,
  checkoutStatus,
  upgradeStatus,
  hasSubscription,
  unreadResponse,
}: MobileDashboardViewProps) {
  return (
    <div className="mobile-card-stack px-4 pb-4 pt-4 md:hidden">
      <MobileCoachingStatusCard
        membershipTier={membershipTier}
        coachingAvailability={coachingAvailability}
        freeSubmissionUsed={freeSubmissionUsed}
        unreadResponse={unreadResponse}
      />

      {checkoutStatus === "success" && membershipTier !== "BASIC" ? (
        <article className="mobile-card border-[#22c55e]/40 bg-[#22c55e]/10 text-sm text-[#bafccf]">
          Payment successful. Your membership is active and your dashboard access has been updated.
        </article>
      ) : null}

      {(upgradeStatus === "memorable-required" || upgradeStatus === "pro-required") && (
        <article className="mobile-card border-yellow-500/40 bg-yellow-500/10 text-sm text-yellow-100">
          Memorable or Elite membership is required to access coaching submission forms.
        </article>
      )}

      {upgradeStatus === "free-submission-used" && (
        <article className="mobile-card border-yellow-500/40 bg-yellow-500/10 text-sm text-yellow-100">
          Your one free submission has already been used. Upgrade to continue with additional
          submissions and unlocked training content.
        </article>
      )}

      <DashboardPlaybookProgressCard membershipTier={membershipTier} userId={userId} />

      {canAccessCoachingNav(membershipTier) ? (
        <div className="mobile-card [&_article]:border-0 [&_article]:bg-transparent [&_article]:p-0">
          <MonthlyGoalProgressCard
            hasCheckin={Boolean(currentMonthGoalCheckin)}
            goals={currentMonthGoalCheckin?.goals ?? []}
          />
        </div>
      ) : null}

      {membershipTier === "FREE" || membershipTier === "BASIC" ? (
        <div className="[&_section]:mt-0 [&_section]:rounded-2xl [&_section]:border [&_section]:border-[#18243a] [&_section]:p-4">
          <DashboardUpgradeSection membershipTier={membershipTier} hasSubscription={hasSubscription} />
        </div>
      ) : null}
    </div>
  );
}
