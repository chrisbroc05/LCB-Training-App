import OrgPickTeamBanner from "@/app/dashboard/OrgPickTeamBanner";
import OrgTrialDashboardCard from "@/app/dashboard/OrgTrialDashboardCard";
import OrgWeeklyFocusCard from "@/app/dashboard/OrgWeeklyFocusCard";

type OrgTrialTodayHomeProps = {
  userId: string;
};

export default function OrgTrialTodayHome({ userId }: OrgTrialTodayHomeProps) {
  return (
    <div className="space-y-4">
      <OrgWeeklyFocusCard userId={userId} />
      <OrgTrialDashboardCard userId={userId} />
      <OrgPickTeamBanner userId={userId} />
    </div>
  );
}
