"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AdminQuizPanel from "@/app/admin/leads/AdminQuizPanel";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";
import { formatLeadResourceCheckoutStatus } from "@/lib/lead-checkout-status-shared";
import { getResourceDefinition } from "@/lib/resources-shared";

type LeadRow = {
  id: string;
  email: string;
  firstName: string;
  role: string;
  source: string;
  isBuyer: boolean;
  createdAt: string;
  resources: {
    resourceSlug: string;
    checkoutStartedAt: string | null;
    createdAt: string;
  }[];
};

type PurchaseRow = {
  id: string;
  email: string;
  resourceSlug: string;
  amountCents: number | null;
  createdAt: string;
  stripeSessionId: string;
};

type QuizDashboard = {
  rows: Array<{
    id: string;
    leadId: string | null;
    name: string;
    email: string;
    role: string;
    score: number | null;
    level: string | null;
    mindset: number | null;
    gameIq: number | null;
    training: number | null;
    completedAt: string | null;
  }>;
  totalCompleted: number;
  averageScore: number;
  levelCounts: Record<string, number>;
  questionStats: Array<{
    order: number;
    prompt: string;
    difficulty: string;
    percentCorrect: number;
    answered: number;
  }>;
};

type AdminLeadsPanelProps = {
  leads: LeadRow[];
  purchases: PurchaseRow[];
  quizDashboard?: QuizDashboard;
  view?: "leads" | "sales" | "combined";
};

function buildPurchasedSlugsByEmail(purchases: PurchaseRow[]) {
  const map = new Map<string, Set<string>>();
  for (const purchase of purchases) {
    const email = purchase.email.toLowerCase();
    const set = map.get(email) ?? new Set<string>();
    set.add(purchase.resourceSlug);
    map.set(email, set);
  }
  return map;
}

function formatResourceFunnel(lead: LeadRow, purchasedSlugs: Set<string>) {
  const labels: string[] = [];
  for (const resource of lead.resources) {
    const definition = getResourceDefinition(resource.resourceSlug);
    if (definition?.type !== "PAID_DOWNLOAD") {
      continue;
    }
    const status = formatLeadResourceCheckoutStatus({
      resourceSlug: resource.resourceSlug,
      checkoutStartedAt: resource.checkoutStartedAt,
      resourceCreatedAt: resource.createdAt,
      purchasedResourceSlugs: purchasedSlugs,
    });
    if (status === "Checkout started") {
      labels.push(`${resource.resourceSlug}: Checkout started`);
    } else if (status === "Purchased") {
      labels.push(`${resource.resourceSlug}: Purchased`);
    }
  }
  return labels.length ? labels.join("; ") : "-";
}

export default function AdminLeadsPanel({
  leads,
  purchases,
  quizDashboard,
  view = "combined",
}: AdminLeadsPanelProps) {
  const [activeTab, setActiveTab] = useState<"leads" | "quiz">("leads");
  const showLeads = view === "leads" || view === "combined";
  const showSales = view === "sales" || view === "combined";
  const showQuiz = view === "combined" && quizDashboard;
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const purchasedByEmail = useMemo(() => buildPurchasedSlugsByEmail(purchases), [purchases]);

  const filtered = useMemo(() => {
    if (roleFilter === "ALL") {
      return leads;
    }
    return leads.filter((lead) => lead.role === roleFilter);
  }, [leads, roleFilter]);

  const exportCsv = () => {
    const header = ["name", "email", "role", "source", "resources", "funnel", "buyer", "created"];
    const rows = filtered.map((lead) => {
      const purchased = purchasedByEmail.get(lead.email.toLowerCase()) ?? new Set<string>();
      return [
        lead.firstName,
        lead.email,
        lead.role,
        lead.source,
        lead.resources.map((resource) => resource.resourceSlug).join("|"),
        formatResourceFunnel(lead, purchased),
        lead.isBuyer ? "yes" : "no",
        lead.createdAt,
      ];
    });
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "lcb-leads.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      {showQuiz ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("leads")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              activeTab === "leads"
                ? "bg-[#22c55e]/20 text-[#9df3bd]"
                : "border border-[#2b3650] text-zinc-400"
            }`}
          >
            Leads
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("quiz")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              activeTab === "quiz"
                ? "bg-[#22c55e]/20 text-[#9df3bd]"
                : "border border-[#2b3650] text-zinc-400"
            }`}
          >
            Player IQ Quiz
          </button>
        </div>
      ) : null}

      {showQuiz && activeTab === "quiz" && quizDashboard ? (
        <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
          <AdminQuizPanel {...quizDashboard} />
        </section>
      ) : null}

      {showLeads && (!showQuiz || activeTab === "leads") ? (
      <>
      <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-100">Leads</h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2 text-sm text-white"
            >
              <option value="ALL">All roles</option>
              <option value="PLAYER">Player</option>
              <option value="PARENT">Parent</option>
              <option value="COACH">Coach</option>
            </select>
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-full bg-[#2D6A4F] px-4 py-2 text-sm font-semibold text-white"
            >
              Export CSV
            </button>
          </div>
        </div>
        <div className="admin-table-wrap mt-4">
          <table className="min-w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Role</th>
                <th className="px-2 py-2">Source</th>
                <th className="px-2 py-2">Resources</th>
                <th className="px-2 py-2">Paid funnel</th>
                <th className="px-2 py-2">Buyer</th>
                <th className="px-2 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => {
                const purchased = purchasedByEmail.get(lead.email.toLowerCase()) ?? new Set<string>();
                return (
                  <tr key={lead.id} className="border-t border-[#18243a]">
                    <td className="px-2 py-2">
                      <Link
                        href={ADMIN_ROUTES.business.leadDetail(lead.id)}
                        className="font-medium text-[#9df3bd] hover:underline"
                      >
                        {lead.firstName}
                      </Link>
                    </td>
                    <td className="px-2 py-2">
                      <Link
                        href={ADMIN_ROUTES.business.leadDetail(lead.id)}
                        className="text-[#52B788] hover:underline"
                      >
                        {lead.email}
                      </Link>
                    </td>
                    <td className="px-2 py-2">{lead.role}</td>
                    <td className="px-2 py-2">{lead.source}</td>
                    <td className="px-2 py-2">
                      {lead.resources.map((resource) => resource.resourceSlug).join(", ") || "-"}
                    </td>
                    <td className="px-2 py-2 text-xs text-amber-200/90">
                      {formatResourceFunnel(lead, purchased)}
                    </td>
                    <td className="px-2 py-2">{lead.isBuyer ? "Yes" : "No"}</td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {showSales ? (
      <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-100">Resource purchases</h2>
        <div className="admin-table-wrap mt-4">
          <table className="min-w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Resource</th>
                <th className="px-2 py-2">Amount</th>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Session</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="border-t border-[#18243a]">
                  <td className="px-2 py-2">{purchase.email}</td>
                  <td className="px-2 py-2">{purchase.resourceSlug}</td>
                  <td className="px-2 py-2">
                    {purchase.amountCents != null
                      ? `$${(purchase.amountCents / 100).toFixed(2)}`
                      : "-"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {new Date(purchase.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-2 py-2 font-mono text-xs">{purchase.stripeSessionId.slice(0, 16)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      ) : null}
      </>
      ) : null}

      {showSales && view === "sales" ? (
      <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-100">Resource purchases</h2>
        <div className="admin-table-wrap mt-4">
          <table className="min-w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Resource</th>
                <th className="px-2 py-2">Amount</th>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Session</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="border-t border-[#18243a]">
                  <td className="px-2 py-2">{purchase.email}</td>
                  <td className="px-2 py-2">{purchase.resourceSlug}</td>
                  <td className="px-2 py-2">
                    {purchase.amountCents != null
                      ? `$${(purchase.amountCents / 100).toFixed(2)}`
                      : "-"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {new Date(purchase.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-2 py-2 font-mono text-xs">{purchase.stripeSessionId.slice(0, 16)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      ) : null}
    </div>
  );
}
