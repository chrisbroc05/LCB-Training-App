import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import CompleteMembershipCheckoutClient from "@/app/upgrade/complete-checkout/CompleteMembershipCheckoutClient";
import { authOptions } from "@/lib/auth";
import { consumeMembershipCheckoutIntent } from "@/lib/membership-checkout-intent-server";

export default async function CompleteMembershipCheckoutPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth?mode=login");
  }

  const intent = await consumeMembershipCheckoutIntent(session.user.id);
  if (!intent) {
    redirect("/upgrade");
  }

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-lg items-center justify-center px-4 py-16">
      <CompleteMembershipCheckoutClient
        level={intent.level}
        billingInterval={intent.billingInterval}
      />
    </div>
  );
}
