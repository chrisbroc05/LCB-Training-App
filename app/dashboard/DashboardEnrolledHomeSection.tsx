import DashboardBookCallCard from "@/app/dashboard/DashboardBookCallCard";
import DashboardEnrolledSubmissionCard from "@/app/dashboard/DashboardEnrolledSubmissionCard";
import DashboardPlaybookProgressCard from "@/app/dashboard/DashboardPlaybookProgressCard";
import MonthlyGoalProgressCard from "@/app/dashboard/MonthlyGoalProgressCard";
import type { DatabaseTier } from "@/lib/membership";

type DashboardEnrolledHomeSectionProps = {
  userId: string;
  membershipTier: DatabaseTier;
  calendlyBookingUrl: string;
  callBooked: boolean;
  callScheduledAt: Date | null;
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
  layout?: "desktop" | "mobile";
};

export default function DashboardEnrolledHomeSection({
  userId,
  membershipTier,
  calendlyBookingUrl,
  callBooked,
  callScheduledAt,
  currentMonthGoalCheckin,
  layout = "desktop",
}: DashboardEnrolledHomeSectionProps) {
  const cardClassName = layout === "mobile" ? "mobile-card" : "";
  const gridClassName =
    layout === "mobile"
      ? "mobile-card-stack"
      : "mt-8 grid gap-5 sm:grid-cols-2";

  return (
    <div className={gridClassName}>
      <DashboardEnrolledSubmissionCard className={cardClassName} />
      <DashboardPlaybookProgressCard
        membershipTier={membershipTier}
        userId={userId}
        className={cardClassName}
        showForEnrolled
      />
      <div className={layout === "desktop" ? "sm:col-span-2" : ""}>
        <MonthlyGoalProgressCard
          hasCheckin={Boolean(currentMonthGoalCheckin)}
          goals={currentMonthGoalCheckin?.goals ?? []}
          className={cardClassName}
        />
      </div>
      <DashboardBookCallCard
        calendlyBookingUrl={calendlyBookingUrl}
        callBooked={callBooked}
        callScheduledAt={callScheduledAt}
        className={cardClassName}
      />
    </div>
  );
}
