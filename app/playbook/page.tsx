import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PlaybookApp from "@/app/playbook/PlaybookApp";
import PlaybookPurchasePage from "@/app/playbook/PlaybookPurchasePage";
import { canAccessPlaybook } from "@/lib/membership";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import { emptyAccessUserRow } from "@/lib/empty-access-user-shared";
import { prisma } from "@/lib/prisma";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import { shouldShowPlaybookCorePlusUpsell } from "@/lib/playbook-core-upsell-shared";

type PlaybookPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PlaybookPage({ searchParams }: PlaybookPageProps) {
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const autoStartCheckout = resolvedSearchParams.startCheckout === "1";

  let membershipLevelForUpsell: string | null = null;

  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: userAccessSelect,
    });
    const access = user
      ? toAccessUserFields(user)
      : toAccessUserFields(emptyAccessUserRow);
    membershipLevelForUpsell = access.membershipLevel;

    if (canAccessPlaybook(access.membershipTier, access.playbookLegacyAccess, access.membershipLevel, access.membershipLevelExpiresAt)) {
      return <PlaybookApp />;
    }
  }

  const showCorePlusUpsell = shouldShowPlaybookCorePlusUpsell(
    membershipLevelForUpsell as MembershipLevelKey | null,
  );

  return (
    <PlaybookPurchasePage
      isLoggedIn={Boolean(session?.user)}
      autoStartCheckout={autoStartCheckout}
      showCorePlusUpsell={showCorePlusUpsell}
    />
  );
}
