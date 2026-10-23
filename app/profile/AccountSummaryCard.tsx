import ProfileCard from "@/app/profile/ProfileCard";
import {
  profileBodyTextClass,
  profileLabelClass,
  profileValueClass,
  tierBadgeStyles,
} from "@/app/profile/profile-styles";
import type { DatabaseTier } from "@/lib/membership";

type AccountSummaryCardProps = {
  name: string | null;
  email: string;
  planLabel: string;
  membershipTier: DatabaseTier;
  memberSince: string;
  submissionsRemaining: number | null;
  playbookSubmissionsLimit: number | null;
  showLifetimeAccess: boolean;
  playbookLegacyAccess?: boolean;
};

export default function AccountSummaryCard({
  name,
  email,
  planLabel,
  membershipTier,
  memberSince,
  submissionsRemaining,
  playbookSubmissionsLimit,
  showLifetimeAccess,
  playbookLegacyAccess = false,
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
            {planLabel}
          </span>
        </div>
        <div>
          <p className={profileLabelClass}>Member since</p>
          <p className={profileValueClass}>{memberSince}</p>
        </div>
        {submissionsRemaining !== null ? (
          <div className="sm:col-span-2">
            <p className={profileLabelClass}>
              {membershipTier === "BASIC"
                ? "Playbook coaching submissions remaining (lifetime)"
                : "Coaching submissions remaining this month"}
            </p>
            <p className={`${profileValueClass} text-2xl font-bold text-[#9df3bd]`}>
              {membershipTier === "BASIC" && playbookSubmissionsLimit
                ? `${submissionsRemaining} of ${playbookSubmissionsLimit}`
                : submissionsRemaining}
            </p>
          </div>
        ) : null}
        {showLifetimeAccess ? (
          <div className="sm:col-span-2">
            <span className="inline-flex rounded-full border border-blue-400/40 bg-blue-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-100">
              Lifetime Access
            </span>
            <p className={`mt-2 ${profileBodyTextClass}`}>
              {playbookLegacyAccess
                ? "Your Basic membership includes lifetime access to the full drill library, workout PDFs, The Next Level Playbook, and 2 personal swing or video breakdowns from Coach Broc."
                : "Your Basic membership includes lifetime access to The Next Level Playbook, a starter drill set, four bonus guides, and 1 personal swing or video breakdown from Coach Broc."}
            </p>
          </div>
        ) : null}
      </div>
    </ProfileCard>
  );
}
