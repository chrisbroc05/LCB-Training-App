import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PlaybookApp from "@/app/playbook/PlaybookApp";
import PlaybookPurchasePage from "@/app/playbook/PlaybookPurchasePage";
import { canViewPlaybook, resolveEffectiveLevel } from "@/lib/access-shared";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import PlaybookOrgTrialLockedPage from "@/app/playbook/PlaybookOrgTrialLockedPage";
import { buildOrgTrialPlaybookLockedCopy } from "@/lib/org-trial-playbook-locked-shared";
import { emptyAccessUserRow } from "@/lib/empty-access-user-shared";
import { fallbackDeferredParentAccountSignupConsent } from "@/lib/legal-server";
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
  const checkoutCancelled = resolvedSearchParams.checkout === "cancelled";

  let membershipLevelForUpsell: string | null = null;

  if (session?.user) {
    if (checkoutCancelled) {
      await fallbackDeferredParentAccountSignupConsent(session.user.id, "checkout_canceled");
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        ...userAccessSelect,
        organization: {
          select: {
            name: true,
            active: true,
            billingMode: true,
            coveredLevel: true,
            trialStartsAt: true,
            trialEndsAt: true,
            trialLockedCopy: true,
            logoUrl: true,
            foundingOfferEnabled: true,
            foundingOfferDeadline: true,
            foundingOfferMonths: true,
          },
        },
      },
    });
    const access = user
      ? toAccessUserFields(user)
      : toAccessUserFields(emptyAccessUserRow);
    membershipLevelForUpsell = access.membershipLevel;

    if (canViewPlaybook(access)) {
      return <PlaybookApp />;
    }
    if (resolveEffectiveLevel(access) === "ORG_TRIAL") {
      const org = user?.organization;
      const copy = buildOrgTrialPlaybookLockedCopy({
        orgName: access.orgName ?? org?.name ?? null,
        founding: org
          ? {
              foundingOfferEnabled: org.foundingOfferEnabled,
              foundingOfferDeadline: org.foundingOfferDeadline,
              foundingOfferMonths: org.foundingOfferMonths,
            }
          : null,
      });
      return <PlaybookOrgTrialLockedPage copy={copy} />;
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
