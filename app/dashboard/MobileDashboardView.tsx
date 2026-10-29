import DashboardEnrolledHomeSection from "@/app/dashboard/DashboardEnrolledHomeSection";
import ProgramSetupBanner from "@/app/dashboard/ProgramSetupBanner";
import DashboardPlaybookProgressCard from "@/app/dashboard/DashboardPlaybookProgressCard";
import DashboardUpgradeSection from "@/app/dashboard/DashboardUpgradeSection";
import MobileCoachingStatusCard from "@/app/dashboard/MobileCoachingStatusCard";
import MonthlyGoalProgressCard from "@/app/dashboard/MonthlyGoalProgressCard";
import type { CoachingSubmissionUserFields } from "@/lib/coaching-submissions-shared";
import type { KeepBuildingCoachingContext } from "@/lib/coaching-keep-building-shared";
import { canAccessCoachingNav, type DatabaseTier } from "@/lib/membership";
import { MEMBERSHIP_LEVELS } from "@/lib/membership-levels-shared";
import type { AccessUserFields } from "@/lib/access-shared";
import InPersonEmergencyReminderCard from "@/components/InPersonEmergencyReminderCard";
import OrgTrialDashboardCard from "@/app/dashboard/OrgTrialDashboardCard";
import OrgWeeklyFocusCard from "@/app/dashboard/OrgWeeklyFocusCard";

type UnreadResponseNotification = {
  id: number;
  title: string;
  linkUrl: string | null;
};

type MobileDashboardViewProps = {
  userId: string;
  membershipTier: DatabaseTier;
  access: AccessUserFields;
  coachingUser: CoachingSubmissionUserFields | null;
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
  checkoutProduct: string | null;
  upgradeStatus: string | null;
  unreadResponse: UnreadResponseNotification | null;
  twelveWeekCallBooked: boolean;
  twelveWeekCallScheduledAt: Date | null;
  calendlyBookingUrl: string;
  showProgramSetupBanner: boolean;
  hasProgramEnrollmentRow: boolean;
  isPersonalProgramMember: boolean;
  isAllAccessProgramMember: boolean;
  showInPersonEmergencyReminder: boolean;
  keepBuildingCoaching: KeepBuildingCoachingContext | null;
};

export default function MobileDashboardView({
  userId,
  membershipTier,
  access,
  coachingUser,
  currentMonthGoalCheckin,
  checkoutStatus,
  checkoutProduct,
  upgradeStatus,
  unreadResponse,
  twelveWeekCallBooked,
  twelveWeekCallScheduledAt,
  calendlyBookingUrl,
  showProgramSetupBanner,
  hasProgramEnrollmentRow,
  isPersonalProgramMember,
  isAllAccessProgramMember,
  showInPersonEmergencyReminder,
  keepBuildingCoaching,
}: MobileDashboardViewProps) {
  const isEnrolled = isPersonalProgramMember;

  return (
    <div className="mobile-card-stack px-4 pb-4 pt-4 md:hidden">
      {checkoutStatus === "success" && checkoutProduct === "playbook" && membershipTier === "BASIC" ? (
        <article className="mobile-card border-[#22c55e]/40 bg-[#22c55e]/10 text-sm text-[#bafccf]">
          Payment successful. The Next Level Playbook is unlocked and ready on your dashboard.
        </article>
      ) : null}

      {checkoutStatus === "success" &&
      checkoutProduct !== "playbook" &&
      isEnrolled &&
      !isAllAccessProgramMember ? (
        <article className="mobile-card border-[#22c55e]/40 bg-[#22c55e]/10 text-sm text-[#bafccf]">
          Payment successful. Your 12-Week Coaching Program is active and your dashboard access has
          been updated.
        </article>
      ) : null}

      {checkoutStatus === "success" &&
      checkoutProduct !== "playbook" &&
      isAllAccessProgramMember ? (
        <article className="mobile-card border-[#22c55e]/40 bg-[#22c55e]/10 text-sm text-[#bafccf]">
          Payment successful. {MEMBERSHIP_LEVELS.ALL_ACCESS.displayName} is active. Finish program
          setup to unlock Today and your daily plan.
        </article>
      ) : null}

      {checkoutStatus === "success" &&
      checkoutProduct !== "playbook" &&
      !isEnrolled &&
      membershipTier !== "BASIC" ? (
        <article className="mobile-card border-[#22c55e]/40 bg-[#22c55e]/10 text-sm text-[#bafccf]">
          Payment successful. Your membership is active and your dashboard access has been updated.
        </article>
      ) : null}

      {(upgradeStatus === "memorable-required" || upgradeStatus === "pro-required") && (
        <article className="mobile-card border-yellow-500/40 bg-yellow-500/10 text-sm text-yellow-100">
          The 12-Week Coaching Program is required to access coaching submission forms.
        </article>
      )}

      {upgradeStatus === "free-submission-used" && (
        <article className="mobile-card border-yellow-500/40 bg-yellow-500/10 text-sm text-yellow-100">
          Your one free submission has already been used. Join the 12-Week Coaching Program to
          continue with additional submissions and unlocked training content.
        </article>
      )}

      {showInPersonEmergencyReminder ? <InPersonEmergencyReminderCard /> : null}

      <OrgWeeklyFocusCard userId={userId} />
      <OrgTrialDashboardCard userId={userId} />

      {hasProgramEnrollmentRow ? (
        <>
          {showProgramSetupBanner ? (
            <div className="mobile-card p-0 [&_section]:mt-0">
              <ProgramSetupBanner />
            </div>
          ) : null}
          <DashboardEnrolledHomeSection
            userId={userId}
            membershipTier={membershipTier}
            calendlyBookingUrl={calendlyBookingUrl}
            callBooked={twelveWeekCallBooked}
            callScheduledAt={twelveWeekCallScheduledAt}
            currentMonthGoalCheckin={currentMonthGoalCheckin}
            layout="mobile"
          />
        </>
      ) : (
        <>
          {coachingUser ? (
            <MobileCoachingStatusCard
              coachingUser={coachingUser}
              unreadResponse={unreadResponse}
              keepBuilding={keepBuildingCoaching}
            />
          ) : null}

          <DashboardPlaybookProgressCard userId={userId} />

          {canAccessCoachingNav(membershipTier) ? (
            <div className="mobile-card [&_article]:border-0 [&_article]:bg-transparent [&_article]:p-0">
              <MonthlyGoalProgressCard
                hasCheckin={Boolean(currentMonthGoalCheckin)}
                goals={currentMonthGoalCheckin?.goals ?? []}
              />
            </div>
          ) : null}

          <div className="[&_section]:mt-0 [&_section]:rounded-2xl [&_section]:border [&_section]:border-[#18243a] [&_section]:p-4">
            <DashboardUpgradeSection membershipTier={membershipTier} access={access} />
          </div>
        </>
      )}
    </div>
  );
}
