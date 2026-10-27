import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import DevSubscriptionTestingPanel from "@/app/dev/subscription-testing/DevSubscriptionTestingPanel";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export default async function DevSubscriptionTestingPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdminEmail(session.user.email)) {
    notFound();
  }

  const sub = await prisma.membershipSubscription.findUnique({
    where: { userId: session.user.id },
    select: {
      level: true,
      status: true,
      pastDueGraceEndsAt: true,
      stripeSubscriptionId: true,
      stripeCustomerId: true,
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-zinc-100">Dev: subscription testing</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Local development only. Simulates renewal failure and grace expiry without waiting 7 days.
      </p>
      <DevSubscriptionTestingPanel
        userId={session.user.id}
        subscription={
          sub
            ? {
                level: sub.level,
                status: sub.status,
                pastDueGraceEndsAt: sub.pastDueGraceEndsAt?.toISOString() ?? null,
                stripeSubscriptionId: sub.stripeSubscriptionId,
                stripeCustomerId: sub.stripeCustomerId,
              }
            : null
        }
      />
    </div>
  );
}
