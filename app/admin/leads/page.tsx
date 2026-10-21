import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import AdminLeadsPanel from "@/app/admin/leads/AdminLeadsPanel";
import { prisma } from "@/lib/prisma";

export default async function AdminLeadsPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/dashboard");
  }

  const leadRows = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      resources: {
        select: {
          resourceSlug: true,
          checkoutStartedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const purchaseRows = await prisma.resourcePurchase.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      email: true,
      resourceSlug: true,
      amountCents: true,
      createdAt: true,
      stripeSessionId: true,
    },
  });

  const leads = leadRows.map((lead) => ({
    ...lead,
    createdAt: lead.createdAt.toISOString(),
    resources: lead.resources.map((resource) => ({
      ...resource,
      createdAt: resource.createdAt.toISOString(),
      checkoutStartedAt: resource.checkoutStartedAt?.toISOString() ?? null,
    })),
  }));

  const purchases = purchaseRows.map((purchase) => ({
    ...purchase,
    createdAt: purchase.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-zinc-100">Leads and resource purchases</h1>
        <Link href="/admin" className="text-sm text-[#52B788] underline">
          Back to admin
        </Link>
      </div>
      <AdminLeadsPanel leads={leads} purchases={purchases} />
    </div>
  );
}
