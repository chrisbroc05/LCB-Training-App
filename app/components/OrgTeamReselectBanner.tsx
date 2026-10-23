import Link from "next/link";
import { userNeedsInactiveOrgTeamReselection } from "@/lib/org-server";

type OrgTeamReselectBannerProps = {
  userId: string;
};

export default async function OrgTeamReselectBanner({ userId }: OrgTeamReselectBannerProps) {
  const needsReselect = await userNeedsInactiveOrgTeamReselection(userId);
  if (!needsReselect) {
    return null;
  }

  return (
    <div className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100">
      Your team from last season is no longer active.{" "}
      <Link href="/settings#org-team" className="font-semibold underline underline-offset-2">
        Choose your team in Settings
      </Link>
      .
    </div>
  );
}
