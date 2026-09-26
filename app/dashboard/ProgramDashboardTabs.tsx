import ProgramDashboardTabsClient from "@/app/dashboard/ProgramDashboardTabsClient";
import DashboardEnrolledHomeSection from "@/app/dashboard/DashboardEnrolledHomeSection";
import type { DatabaseTier } from "@/lib/membership";

type ProgramDashboardTabsProps = {
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

export default function ProgramDashboardTabs(props: ProgramDashboardTabsProps) {
  return (
    <ProgramDashboardTabsClient
      layout={props.layout}
      homeSlot={
        <DashboardEnrolledHomeSection
          userId={props.userId}
          membershipTier={props.membershipTier}
          calendlyBookingUrl={props.calendlyBookingUrl}
          callBooked={props.callBooked}
          callScheduledAt={props.callScheduledAt}
          currentMonthGoalCheckin={props.currentMonthGoalCheckin}
          layout={props.layout}
        />
      }
    />
  );
}
