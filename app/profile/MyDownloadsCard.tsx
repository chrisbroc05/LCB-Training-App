import Link from "next/link";
import { createFixItPlanAccessToken } from "@/lib/fix-it-plan-access-token";
import { buildFixItPlanPath, isFixItResourceSlug } from "@/lib/fix-it-plans-shared";
import { createResourceDownloadToken } from "@/lib/resource-download-token";
import { listResourcePurchasesForAccount } from "@/lib/resources-access-server";
import {
  getResourceDefinition,
  getResourceDownloadLabel,
} from "@/lib/resources-shared";

type MyDownloadsCardProps = {
  userId: string;
  email: string;
};

export default async function MyDownloadsCard({ userId, email }: MyDownloadsCardProps) {
  const purchases = await listResourcePurchasesForAccount({ userId, email });
  if (!purchases.length) {
    return null;
  }

  const grouped = new Map<string, typeof purchases>();
  for (const purchase of purchases) {
    const list = grouped.get(purchase.resourceSlug) ?? [];
    list.push(purchase);
    grouped.set(purchase.resourceSlug, list);
  }

  return (
    <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-100">My resource downloads</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Paid resources from the hub. Fix-It plans include a permanent plan page link. PDF links expire in 15 minutes.
      </p>
      <ul className="mt-4 space-y-4">
        {[...grouped.entries()].map(([slug, slugPurchases]) => {
          const resource = getResourceDefinition(slug);
          if (!resource?.downloadFileKeys?.length) {
            return null;
          }
          const latest = slugPurchases[0];
          const fixItPlanHref = isFixItResourceSlug(slug)
            ? `${buildFixItPlanPath(slug)}?token=${encodeURIComponent(
                createFixItPlanAccessToken({ email, resourceSlug: slug }),
              )}`
            : null;
          return (
            <li key={slug} className="rounded-xl border border-[#2b3650] p-4">
              <p className="font-medium text-zinc-100">{resource.title}</p>
              <p className="mt-1 text-xs text-zinc-500">
                Purchased {latest.createdAt.toLocaleDateString()}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {fixItPlanHref ? (
                  <Link
                    href={fixItPlanHref}
                    className="inline-flex min-h-[40px] items-center rounded-full bg-[#2D6A4F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#52B788]"
                  >
                    Open plan page
                  </Link>
                ) : null}
                {resource.downloadFileKeys.map((fileKey) => {
                  const token = createResourceDownloadToken({
                    email,
                    resourceSlug: slug,
                    fileKey,
                  });
                  const href = `/api/resources/download?token=${encodeURIComponent(token)}`;
                  return (
                    <a
                      key={fileKey}
                      href={href}
                      className="inline-flex min-h-[40px] items-center rounded-full bg-[#2D6A4F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#52B788]"
                    >
                      {getResourceDownloadLabel(fileKey)}
                    </a>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm text-zinc-400">
        <Link href="/resources" className="text-[#52B788] underline">
          Browse all resources
        </Link>
      </p>
    </section>
  );
}
