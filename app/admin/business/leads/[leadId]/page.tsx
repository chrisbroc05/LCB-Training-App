import Link from "next/link";
import { notFound } from "next/navigation";
import AdminPageHeader from "@/app/admin/AdminPageHeader";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";
import { loadAdminLeadDetail } from "@/lib/admin-lead-detail-server";

type PageProps = { params: Promise<{ leadId: string }> };

export default async function AdminLeadDetailPage({ params }: PageProps) {
  const { leadId } = await params;
  const lead = await loadAdminLeadDetail(leadId);
  if (!lead) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={lead.firstName}
        description={`${lead.email} | ${lead.role} | Source: ${lead.source}`}
        backHref={ADMIN_ROUTES.business.leads}
        backLabel="Leads"
      />

      <section className="admin-page-section grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-zinc-500">Created</p>
          <p className="mt-1 text-sm text-zinc-200">{new Date(lead.createdAt).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-zinc-500">Buyer flag</p>
          <p className="mt-1 text-sm text-zinc-200">{lead.isBuyer ? "Yes" : "No"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-zinc-500">Unsubscribe</p>
          <p className="mt-1 text-sm text-zinc-200">
            {lead.unsubscribedAt
              ? `Unsubscribed ${new Date(lead.unsubscribedAt).toLocaleDateString()}`
              : "Subscribed"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-zinc-500">Account</p>
          {lead.member ? (
            <Link href={ADMIN_ROUTES.players.members} className="mt-1 inline-flex text-sm font-semibold text-[#52B788]">
              {lead.member.name ?? lead.member.email} (member)
            </Link>
          ) : (
            <p className="mt-1 text-sm text-zinc-500">No linked member account</p>
          )}
        </div>
      </section>

      <section className="admin-page-section space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Resource clicks</h2>
        {lead.resources.length === 0 ? (
          <p className="text-sm text-zinc-500">No resource clicks yet.</p>
        ) : (
          <ul className="divide-y divide-[#18243a] rounded-xl border border-[#18243a]">
            {lead.resources.map((resource) => (
              <li key={resource.id} className="px-3 py-3 sm:px-4">
                <p className="text-sm font-medium text-zinc-100">{resource.title}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Clicked {new Date(resource.clickedAt).toLocaleString()}
                  {resource.checkoutStartedAt
                    ? ` | Checkout started ${new Date(resource.checkoutStartedAt).toLocaleString()}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-page-section space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Quiz attempts</h2>
        {lead.quizAttempts.length === 0 ? (
          <p className="text-sm text-zinc-500">No quiz attempts.</p>
        ) : (
          <ul className="divide-y divide-[#18243a] rounded-xl border border-[#18243a]">
            {lead.quizAttempts.map((attempt) => (
              <li key={attempt.id}>
                {attempt.href ? (
                  <Link href={attempt.href} className="block px-3 py-3 hover:bg-[#1a253a]/50 sm:px-4">
                    <p className="text-sm font-medium text-zinc-100">
                      Score {attempt.score ?? "-"} | {attempt.level ?? "In progress"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {attempt.completedAt
                        ? new Date(attempt.completedAt).toLocaleString()
                        : "Not completed"}
                    </p>
                  </Link>
                ) : (
                  <div className="px-3 py-3 sm:px-4">
                    <p className="text-sm text-zinc-400">Attempt in progress</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-page-section space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Purchases</h2>
        {lead.purchases.length === 0 ? (
          <p className="text-sm text-zinc-500">No purchases.</p>
        ) : (
          <ul className="divide-y divide-[#18243a] rounded-xl border border-[#18243a]">
            {lead.purchases.map((purchase) => (
              <li key={purchase.id} className="px-3 py-3 sm:px-4">
                <p className="text-sm font-medium text-zinc-100">{purchase.title}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {purchase.amountCents != null
                    ? `$${(purchase.amountCents / 100).toFixed(2)}`
                    : "Amount n/a"}{" "}
                  | {new Date(purchase.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
