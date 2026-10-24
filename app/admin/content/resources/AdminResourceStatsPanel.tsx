"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";
import type {
  AdminResourceStatsRange,
  AdminResourceStatsRow,
} from "@/lib/admin-resource-stats-shared";

type SortKey =
  | "title"
  | "clicks"
  | "downloads"
  | "checkoutsStarted"
  | "purchases"
  | "revenueCents"
  | "conversionPercent";

const RANGE_OPTIONS: { value: AdminResourceStatsRange; label: string }[] = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "all", label: "All time" },
];

function formatMoney(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function AdminResourceStatsPanel() {
  const [range, setRange] = useState<AdminResourceStatsRange>("30");
  const [rows, setRows] = useState<AdminResourceStatsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("clicks");
  const [sortAsc, setSortAsc] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/admin/resource-stats?range=${range}`, { cache: "no-store" });
    setLoading(false);
    if (!response.ok) {
      return;
    }
    const data = (await response.json()) as { rows: AdminResourceStatsRow[] };
    setRows(data.rows);
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      if (sortKey === "title") {
        return sortAsc
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
      const av = a[sortKey] ?? -1;
      const bv = b[sortKey] ?? -1;
      return sortAsc ? av - bv : bv - av;
    });
    return copy;
  }, [rows, sortAsc, sortKey]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((current) => !current);
      return;
    }
    setSortKey(key);
    setSortAsc(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setRange(option.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              range === option.value
                ? "bg-[#22c55e] text-black"
                : "border border-[#2b3650] text-zinc-300"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-sm text-zinc-400">Loading resource stats...</p> : null}

      <div className="hidden md:block admin-table-wrap">
        <table className="min-w-full text-left text-sm text-zinc-300">
          <thead className="text-xs uppercase text-zinc-500">
            <tr>
              {(
                [
                  ["title", "Resource"],
                  ["clicks", "Clicks"],
                  ["downloads", "Downloads"],
                  ["checkoutsStarted", "Checkouts"],
                  ["purchases", "Purchases"],
                  ["revenueCents", "Revenue"],
                  ["conversionPercent", "Conv %"],
                ] as const
              ).map(([key, label]) => (
                <th key={key} className="px-2 py-2">
                  <button type="button" onClick={() => toggleSort(key)} className="font-semibold">
                    {label}
                    {sortKey === key ? (sortAsc ? " ^" : " v") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.slug} className="border-t border-[#18243a]">
                <td className="px-2 py-2">
                  <Link
                    href={ADMIN_ROUTES.content.resourceDetail(row.slug)}
                    className="font-medium text-[#9df3bd] hover:underline"
                  >
                    {row.title}
                  </Link>
                  <p className="text-xs text-zinc-500">{row.tag}</p>
                </td>
                <td className="px-2 py-2">{row.clicks}</td>
                <td className="px-2 py-2">{row.downloads}</td>
                <td className="px-2 py-2">{row.checkoutsStarted}</td>
                <td className="px-2 py-2">{row.purchases}</td>
                <td className="px-2 py-2">{formatMoney(row.revenueCents)}</td>
                <td className="px-2 py-2">
                  {row.conversionPercent != null ? `${row.conversionPercent}%` : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {sorted.map((row) => (
          <li key={row.slug}>
            <Link
              href={ADMIN_ROUTES.content.resourceDetail(row.slug)}
              className="block rounded-xl border border-[#18243a] bg-[#0A1628]/50 p-3"
            >
              <p className="font-semibold text-zinc-100">{row.title}</p>
              <p className="mt-1 text-xs text-zinc-500">{row.tag}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-400">
                <div>
                  <dt>Clicks</dt>
                  <dd className="text-sm font-semibold text-zinc-200">{row.clicks}</dd>
                </div>
                <div>
                  <dt>Downloads</dt>
                  <dd className="text-sm font-semibold text-zinc-200">{row.downloads}</dd>
                </div>
                <div>
                  <dt>Checkouts</dt>
                  <dd className="text-sm font-semibold text-zinc-200">{row.checkoutsStarted}</dd>
                </div>
                <div>
                  <dt>Purchases</dt>
                  <dd className="text-sm font-semibold text-zinc-200">{row.purchases}</dd>
                </div>
                <div>
                  <dt>Revenue</dt>
                  <dd className="text-sm font-semibold text-zinc-200">{formatMoney(row.revenueCents)}</dd>
                </div>
                <div>
                  <dt>Conv</dt>
                  <dd className="text-sm font-semibold text-zinc-200">
                    {row.conversionPercent != null ? `${row.conversionPercent}%` : "-"}
                  </dd>
                </div>
              </dl>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
