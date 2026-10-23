import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PlaybookApp from "@/app/playbook/PlaybookApp";
import PlaybookPurchasePage from "@/app/playbook/PlaybookPurchasePage";
import { canAccessPlaybook } from "@/lib/membership";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import { emptyAccessUserRow } from "@/lib/empty-access-user-shared";
import { prisma } from "@/lib/prisma";

type PlaybookPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PlaybookPage({ searchParams }: PlaybookPageProps) {
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const autoStartCheckout = resolvedSearchParams.startCheckout === "1";

  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: userAccessSelect,
    });
    const access = user
      ? toAccessUserFields(user)
      : toAccessUserFields(emptyAccessUserRow);

    if (canAccessPlaybook(access.membershipTier, access.playbookLegacyAccess, access.membershipLevel, access.membershipLevelExpiresAt)) {
      return <PlaybookApp />;
    }
  }

  return (
    <PlaybookPurchasePage
      isLoggedIn={Boolean(session?.user)}
      autoStartCheckout={autoStartCheckout}
    />
  );
}
