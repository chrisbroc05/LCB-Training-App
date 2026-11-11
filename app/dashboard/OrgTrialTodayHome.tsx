import OrgPickTeamBanner from "@/app/dashboard/OrgPickTeamBanner";
import OrgTrialDashboardCard from "@/app/dashboard/OrgTrialDashboardCard";
import OrgWeeklyFocusCard from "@/app/dashboard/OrgWeeklyFocusCard";
import DailyChallengeCard from "@/app/dashboard/DailyChallengeCard";

type OrgTrialTodayHomeProps = {
  userId: string;
};

export default function OrgTrialTodayHome({ userId }: OrgTrialTodayHomeProps) {
  return (
    <div className="space-y-4">
      <DailyChallengeCard />
      <OrgWeeklyFocusCard userId={userId} />
      <OrgTrialDashboardCard userId={userId} />
      <OrgPickTeamBanner userId={userId} />
    </div>
  );
}
