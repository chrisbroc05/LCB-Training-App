import { getServerSession } from "next-auth";
import MembershipComparisonTable from "@/app/components/MembershipComparisonTable";
import { authOptions } from "@/lib/auth";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import { activeMembershipLevel, resolveEffectiveLevel } from "@/lib/access-shared";
import { buildMembershipFoundingPlusHighlight } from "@/lib/membership-comparison-shared";
import {
  isMembershipLevelKey,
  listPublicMembershipLevelDefinitions,
  type MembershipLevelKey,
} from "@/lib/membership-levels-shared";
import { isAllAccessCheckoutAvailable } from "@/lib/membership-subscription-server";
import { prisma } from "@/lib/prisma";

type UpgradeMembershipLevelsSectionProps = {
  selectedLevel?: string | null;
};

export default async function UpgradeMembershipLevelsSection({
  selectedLevel = null,
}: UpgradeMembershipLevelsSectionProps) {
  if (listPublicMembershipLevelDefinitions().length === 0) {
    return null;
  }

  const session = await getServerSession(authOptions);
  const allAccessAvailable = await isAllAccessCheckoutAvailable();
  const highlightedLevel =
    selectedLevel && isMembershipLevelKey(selectedLevel) ? selectedLevel : null;

  let currentLevel: MembershipLevelKey | null = null;
  let clubOrgName: string | null = null;
  let foundingPlusHighlight = null as ReturnType<typeof buildMembershipFoundingPlusHighlight>;

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: userAccessSelect,
    });
    if (user) {
      const access = toAccessUserFields(user);
      currentLevel = activeMembershipLevel(access);
      clubOrgName = access.orgName?.trim() ?? null;
      if (resolveEffectiveLevel(access) === "ORG_TRIAL" && user.organization) {
        foundingPlusHighlight = buildMembershipFoundingPlusHighlight({
          orgName: access.orgName,
          founding: {
            foundingOfferEnabled: user.organization.foundingOfferEnabled,
            foundingOfferDeadline: user.organization.foundingOfferDeadline,
            foundingOfferMonths: user.organization.foundingOfferMonths,
          },
        });
      }
    }
  }

  return (
    <section className="mt-10 rounded-3xl border border-[#18243a] bg-[#0A1628] px-5 py-8 sm:px-8 sm:py-10">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">Compare memberships</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Core, Plus, and All-Access. Features match what the app unlocks.
        </p>
      </div>
      <div className="mt-8">
        <MembershipComparisonTable
          mode="upgrade"
          signedIn={Boolean(session?.user?.id)}
          currentLevel={currentLevel}
          selectedLevel={highlightedLevel}
          foundingPlusHighlight={foundingPlusHighlight}
          allAccessAvailable={allAccessAvailable}
          clubOrgName={clubOrgName}
        />
      </div>
    </section>
  );
}
