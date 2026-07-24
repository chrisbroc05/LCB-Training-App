import Link from "next/link";
import { formatDatabaseTierLabel, type DatabaseTier } from "@/lib/membership";

type DashboardMembershipCardProps = {
  membershipTier: DatabaseTier;
  isPaidMember: boolean;
  isManualMembership: boolean;
  subscriptionCurrentPeriodEnd: Date | null;
  subscriptionCancelAtPeriodEnd: boolean;
};

function formatDate(date: Date | null) {
  if (!date) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function DashboardMembershipCard({
  membershipTier,
  isPaidMember,
  isManualMembership,
  subscriptionCurrentPeriodEnd,
  subscriptionCancelAtPeriodEnd,
}: DashboardMembershipCardProps) {
  const showUpgradeLink = membershipTier === "FREE" || membershipTier === "BASIC";

  return (
    <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-100">Membership</h2>
      <div className="mt-3 inline-flex rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">
        {formatDatabaseTierLabel(membershipTier)}
      </div>

      {isPaidMember ? (
        <div className="mt-3 space-y-1 text-sm text-zinc-300">
          {isManualMembership ? (
            <p>Billing: Manual</p>
          ) : (
            <p>Next billing date: {formatDate(subscriptionCurrentPeriodEnd)}</p>
          )}
          {!isManualMembership && subscriptionCancelAtPeriodEnd ? (
            <p className="text-yellow-100">
              Your subscription is set to cancel at the end of the current billing period.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-zinc-300">
          You are on the Free plan. Upgrade anytime to unlock the full drill library, resources,
          and coaching support.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/settings"
          className="inline-flex rounded-full border border-[#2b3650] bg-black/40 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-[#7f9434] hover:text-[#98b144]"
        >
          Manage Membership
        </Link>
        {showUpgradeLink ? (
          <Link
            href="/upgrade"
            className="inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
          >
            Upgrade Membership
          </Link>
        ) : null}
      </div>
    </article>
  );
}
