import ProfileCard from "@/app/profile/ProfileCard";
import {
  profileBodyTextClass,
  profileLabelClass,
  profileValueClass,
  tierBadgeStyles,
} from "@/app/profile/profile-styles";
import { formatDatabaseTierLabel, type DatabaseTier } from "@/lib/membership";

type AccountSummaryCardProps = {
  name: string | null;
  email: string;
  membershipTier: DatabaseTier;
  memberSince: string;
  submissionsRemaining: number | null;
  showLifetimeAccess: boolean;
};

export default function AccountSummaryCard({
  name,
  email,
  membershipTier,
  memberSince,
  submissionsRemaining,
  showLifetimeAccess,
}: AccountSummaryCardProps) {
  return (
    <ProfileCard title="Account Summary">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className={profileLabelClass}>Name</p>
          <p className={profileValueClass}>{name?.trim() || "Not provided"}</p>
        </div>
        <div>
          <p className={profileLabelClass}>Email</p>
          <p className={profileValueClass}>{email}</p>
        </div>
        <div>
          <p className={profileLabelClass}>Membership</p>
          <span
            className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tierBadgeStyles[membershipTier]}`}
          >
            {formatDatabaseTierLabel(membershipTier)}
          </span>
        </div>
        <div>
          <p className={profileLabelClass}>Member since</p>
          <p className={profileValueClass}>{memberSince}</p>
        </div>
        {submissionsRemaining !== null ? (
          <div className="sm:col-span-2">
            <p className={profileLabelClass}>Coaching submissions remaining this month</p>
            <p className={`${profileValueClass} text-2xl font-bold text-[#9df3bd]`}>
              {submissionsRemaining}
            </p>
          </div>
        ) : null}
        {showLifetimeAccess ? (
          <div className="sm:col-span-2">
            <span className="inline-flex rounded-full border border-blue-400/40 bg-blue-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-100">
              Lifetime Access
            </span>
            <p className={`mt-2 ${profileBodyTextClass}`}>
              Your Basic membership includes lifetime access to the full LCB Training library and
              Playbook.
            </p>
          </div>
        ) : null}
      </div>
    </ProfileCard>
  );
}
