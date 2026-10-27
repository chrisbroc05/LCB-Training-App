import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import CompleteMembershipCheckoutClient from "@/app/upgrade/complete-checkout/CompleteMembershipCheckoutClient";
import { authOptions } from "@/lib/auth";
import { isMembershipLevelKey } from "@/lib/membership-levels-shared";
import { prisma } from "@/lib/prisma";

export default async function CompleteMembershipCheckoutPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth?mode=login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { pendingCheckoutLevel: true },
  });

  const level = user?.pendingCheckoutLevel;
  if (!level || !isMembershipLevelKey(level)) {
    redirect("/upgrade");
  }

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-lg items-center justify-center px-4 py-16">
      <CompleteMembershipCheckoutClient level={level} />
    </div>
  );
}
