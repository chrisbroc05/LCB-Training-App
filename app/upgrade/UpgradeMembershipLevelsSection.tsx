import { getServerSession } from "next-auth";
import MembershipLevelCards from "@/app/components/MembershipLevelCards";
import { authOptions } from "@/lib/auth";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import { activeMembershipLevel } from "@/lib/access-shared";
import { resolveMembershipFoundingPlusHighlight } from "@/lib/membership-comparison-shared";
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
  const signedIn = Boolean(session?.user?.id);
  const allAccessAvailable = await isAllAccessCheckoutAvailable();
  const highlightedLevel =
    selectedLevel && isMembershipLevelKey(selectedLevel) ? selectedLevel : null;

  let currentLevel: MembershipLevelKey | null = null;
  let clubOrgName: string | null = null;
  let foundingPlusHighlight = null as ReturnType<
    typeof resolveMembershipFoundingPlusHighlight
  >;

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: userAccessSelect,
    });
    if (user) {
      const access = toAccessUserFields(user);
      currentLevel = activeMembershipLevel(access);
      clubOrgName = access.orgName?.trim() ?? null;
      foundingPlusHighlight = resolveMembershipFoundingPlusHighlight({
        signedIn: true,
        organizationId: access.organizationId,
        orgName: access.orgName,
        founding: user.organization
          ? {
              foundingOfferEnabled: user.organization.foundingOfferEnabled,
              foundingOfferDeadline: user.organization.foundingOfferDeadline,
              foundingOfferMonths: user.organization.foundingOfferMonths,
            }
          : null,
      });
    }
  }

  return (
    <section className="mt-10 rounded-3xl border border-[#18243a] bg-[#0A1628] px-5 py-8 sm:px-8 sm:py-10">
      <MembershipLevelCards
        mode="upgrade"
        title="Compare memberships"
        signedIn={signedIn}
        currentLevel={currentLevel}
        selectedLevel={highlightedLevel}
        foundingPlusHighlight={foundingPlusHighlight}
        allAccessAvailable={allAccessAvailable}
        clubOrgName={clubOrgName}
      />
    </section>
  );
}
