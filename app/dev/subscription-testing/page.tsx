import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import DevSubscriptionTestingPanel from "@/app/dev/subscription-testing/DevSubscriptionTestingPanel";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

export default async function DevSubscriptionTestingPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdminEmail(session.user.email)) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-zinc-100">Dev: subscription testing</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Local development only. Pick a player with a membership subscription, then simulate renewal
        failure or grace expiry without waiting 7 days.
      </p>
      <DevSubscriptionTestingPanel />
    </div>
  );
}
