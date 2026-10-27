import Link from "next/link";
import AdminPageHeader from "@/app/admin/AdminPageHeader";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";
import { prisma } from "@/lib/prisma";
import { getPlatformCoachingSettings, countAllAccessProgramCapUsage } from "@/lib/membership-subscription-server";

export default async function AdminAllAccessWaitlistPage() {
  const [entries, settings, capUsed] = await Promise.all([
    prisma.allAccessWaitlistEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    getPlatformCoachingSettings(),
    countAllAccessProgramCapUsage(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="All-Access waitlist"
        description={`Program cap: ${capUsed} / ${settings.allAccessProgramCap} (All-Access subs + 12-Week players).`}
        backHref={ADMIN_ROUTES.business.hub}
        backLabel="Business"
      />
      <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
        <div className="admin-table-wrap">
          <table className="min-w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Note</th>
                <th className="px-2 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-[#18243a]">
                  <td className="px-2 py-2">{entry.name}</td>
                  <td className="px-2 py-2">
                    {entry.userId ? (
                      <Link href={`/admin/members/${entry.userId}`} className="text-[#52B788] underline">
                        {entry.email}
                      </Link>
                    ) : (
                      entry.email
                    )}
                  </td>
                  <td className="px-2 py-2">{entry.note ?? "-"}</td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {entry.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">No waitlist entries yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
