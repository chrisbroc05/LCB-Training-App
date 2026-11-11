import MembershipComparisonTable from "@/app/components/MembershipComparisonTable";
import { COACH_CALENDLY_URL } from "@/lib/coach-calendly-shared";
import type { AccessUserFields } from "@/lib/access-shared";
import { activeMembershipLevel } from "@/lib/access-shared";
import type { DatabaseTier } from "@/lib/membership";
import { isPublicMembershipLevelsEnabled } from "@/lib/membership-levels-shared";
import type { MembershipFoundingPlusHighlight } from "@/lib/membership-comparison-shared";

type DashboardUpgradeSectionProps = {
  membershipTier: DatabaseTier;
  access: AccessUserFields;
  foundingPlusHighlight?: MembershipFoundingPlusHighlight | null;
};

export default function DashboardUpgradeSection({
  membershipTier,
  access,
  foundingPlusHighlight = null,
}: DashboardUpgradeSectionProps) {
  const levelsLive = isPublicMembershipLevelsEnabled();
  const currentLevel = activeMembershipLevel(access);
  const showBookCall = membershipTier === "FREE";

  if (!levelsLive && !showBookCall) {
    return null;
  }

  return (
    <section className="mt-10 rounded-3xl border border-[#18243a] bg-[#0A1628] px-5 py-8 sm:px-8 sm:py-10">
      {levelsLive ? (
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">
              Membership levels
            </h2>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Compare Core, Plus, and All-Access. Features match what the app unlocks.
            </p>
          </div>
          <div className="mt-8">
            <MembershipComparisonTable
              mode="dashboard"
              currentLevel={currentLevel}
              foundingPlusHighlight={foundingPlusHighlight}
            />
          </div>
        </div>
      ) : null}

      {showBookCall ? (
        <article className="mx-auto mt-8 max-w-xl rounded-2xl border border-[#22c55e]/40 bg-[#22c55e]/10 p-5 sm:p-6">
          <h3 className="text-xl font-semibold text-zinc-100">Have questions?</h3>
          <p className="mt-3 text-sm text-zinc-300">Book a quick call with me.</p>
          <a
            href={COACH_CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
          >
            Book a call
          </a>
        </article>
      ) : null}
    </section>
  );
}
