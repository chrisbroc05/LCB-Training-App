"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";
import type {
  AdminResourceClickRow,
  AdminResourceStatsRange,
} from "@/lib/admin-resource-stats-shared";

const RANGE_OPTIONS: { value: AdminResourceStatsRange; label: string }[] = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "all", label: "All time" },
];

export default function AdminResourceClickList(props: { slug: string; title: string }) {
  const [range, setRange] = useState<AdminResourceStatsRange>("30");
  const [rows, setRows] = useState<AdminResourceClickRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch(
      `/api/admin/resource-stats/${encodeURIComponent(props.slug)}?range=${range}`,
      { cache: "no-store" },
    );
    setLoading(false);
    if (!response.ok) {
      return;
    }
    const data = (await response.json()) as { rows: AdminResourceClickRow[] };
    setRows(data.rows);
  }, [props.slug, range]);

  useEffect(() => {
    void load();
  }, [load]);

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

      {loading ? <p className="text-sm text-zinc-400">Loading clicks...</p> : null}

      {rows.length === 0 && !loading ? (
        <p className="text-sm text-zinc-500">No clicks in this range.</p>
      ) : (
        <ul className="divide-y divide-[#18243a] rounded-xl border border-[#18243a]">
          {rows.map((row) => (
            <li key={`${row.leadId}-${row.clickedAt}`}>
              <Link
                href={ADMIN_ROUTES.business.leadDetail(row.leadId)}
                className="block px-3 py-3 hover:bg-[#1a253a]/50 sm:px-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{row.name}</p>
                    <p className="text-xs text-zinc-500">
                      {row.role} | {new Date(row.clickedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      row.purchased
                        ? "bg-[#22c55e]/20 text-[#9df3bd]"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {row.purchased ? "Bought" : "No purchase"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
