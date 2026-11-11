"use client";

import Link from "next/link";
import MembershipLevelCheckoutButton from "@/app/components/MembershipLevelCheckoutButton";
import {
  formatMembershipComparisonCell,
  listMembershipComparisonColumns,
  listMembershipComparisonRows,
  type MembershipFoundingPlusHighlight,
} from "@/lib/membership-comparison-shared";
import {
  MEMBERSHIP_LEVELS,
  type MembershipLevelKey,
} from "@/lib/membership-levels-shared";

type MembershipComparisonTableProps = {
  currentLevel?: MembershipLevelKey | null;
  selectedLevel?: MembershipLevelKey | null;
  foundingPlusHighlight?: MembershipFoundingPlusHighlight | null;
  /** dashboard: links to /upgrade?level=; upgrade: checkout buttons */
  mode?: "dashboard" | "upgrade";
  signedIn?: boolean;
  allAccessAvailable?: boolean;
  clubOrgName?: string | null;
};

function CellValue({ value }: { value: ReturnType<typeof listMembershipComparisonRows>[number]["cells"]["CORE"] }) {
  if (value.kind === "check") {
    return <span className="font-semibold text-[#52B788]">Yes</span>;
  }
  if (value.kind === "dash") {
    return <span className="text-zinc-500">-</span>;
  }
  return <span className="text-zinc-200">{formatMembershipComparisonCell(value)}</span>;
}

export default function MembershipComparisonTable({
  currentLevel = null,
  selectedLevel = null,
  foundingPlusHighlight = null,
  mode = "dashboard",
  signedIn = true,
  allAccessAvailable = true,
  clubOrgName = null,
}: MembershipComparisonTableProps) {
  const columns = listMembershipComparisonColumns();
  const rows = listMembershipComparisonRows();

  return (
    <div className="space-y-4">
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#2b3650]">
              <th className="py-3 pr-4 font-semibold text-zinc-400">Feature</th>
              {columns.map((column) => {
                const isCurrent = currentLevel === column.key;
                const isSelected = selectedLevel === column.key;
                const highlightPlus =
                  column.key === "PLUS" && Boolean(foundingPlusHighlight);
                return (
                  <th
                    key={column.key}
                    className={`px-3 py-3 align-bottom font-semibold ${
                      isSelected || highlightPlus
                        ? "bg-[#22c55e]/10 text-zinc-100"
                        : "text-zinc-100"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{column.displayName}</span>
                      {isCurrent ? (
                        <span className="rounded-full bg-[#22c55e]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9df3bd]">
                          Your plan
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-base font-bold text-[#98b144]">{column.priceDisplay}</p>
                    {column.note ? (
                      <p className="mt-2 text-xs font-medium leading-snug text-zinc-400">{column.note}</p>
                    ) : null}
                    {highlightPlus && foundingPlusHighlight ? (
                      <p className="mt-2 text-xs font-medium leading-snug text-[#9df3bd]">
                        {foundingPlusHighlight.line}
                      </p>
                    ) : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[#1e2d45]">
                <td className="py-2.5 pr-4 text-zinc-300">{row.label}</td>
                {columns.map((column) => (
                  <td
                    key={`${row.id}-${column.key}`}
                    className={`px-3 py-2.5 ${
                      selectedLevel === column.key ||
                      (column.key === "PLUS" && foundingPlusHighlight)
                        ? "bg-[#22c55e]/5"
                        : ""
                    }`}
                  >
                    <CellValue value={row.cells[column.key]} />
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="py-4 pr-4" />
              {columns.map((column) => (
                <td key={`cta-${column.key}`} className="px-3 py-4 align-top">
                  <ColumnAction
                    level={column.key}
                    mode={mode}
                    isCurrent={currentLevel === column.key}
                    signedIn={signedIn}
                    allAccessAvailable={allAccessAvailable}
                    clubOrgName={clubOrgName}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:hidden">
        {columns.map((column) => {
          const isCurrent = currentLevel === column.key;
          const highlightPlus = column.key === "PLUS" && Boolean(foundingPlusHighlight);
          return (
            <article
              key={column.key}
              className={`min-w-[85%] shrink-0 snap-center rounded-2xl border p-4 ${
                highlightPlus || selectedLevel === column.key
                  ? "border-[#52B788]/50 bg-[#22c55e]/10"
                  : "border-[#18243a] bg-[#0b1324]/80"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-zinc-100">{column.displayName}</h3>
                {isCurrent ? (
                  <span className="rounded-full bg-[#22c55e]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9df3bd]">
                    Your plan
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xl font-bold text-[#98b144]">{column.priceDisplay}</p>
              {column.note ? (
                <p className="mt-2 text-xs font-medium leading-snug text-zinc-400">{column.note}</p>
              ) : null}
              {highlightPlus && foundingPlusHighlight ? (
                <p className="mt-2 text-xs font-medium leading-snug text-[#9df3bd]">
                  {foundingPlusHighlight.line}
                </p>
              ) : null}
              <ul className="mt-4 space-y-2 text-sm">
                {rows.map((row) => (
                  <li
                    key={`${column.key}-${row.id}`}
                    className="flex items-start justify-between gap-3 border-t border-[#1e2d45] pt-2"
                  >
                    <span className="text-zinc-400">{row.label}</span>
                    <span className="shrink-0 text-right">
                      <CellValue value={row.cells[column.key]} />
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <ColumnAction
                  level={column.key}
                  mode={mode}
                  isCurrent={isCurrent}
                  signedIn={signedIn}
                  allAccessAvailable={allAccessAvailable}
                  clubOrgName={clubOrgName}
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ColumnAction(props: {
  level: MembershipLevelKey;
  mode: "dashboard" | "upgrade";
  isCurrent: boolean;
  signedIn: boolean;
  allAccessAvailable: boolean;
  clubOrgName: string | null;
}) {
  if (props.isCurrent) {
    return (
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">Your plan</p>
    );
  }

  if (props.mode === "dashboard") {
    return (
      <Link
        href={`/upgrade?level=${props.level}`}
        className="inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
      >
        Choose {MEMBERSHIP_LEVELS[props.level].displayName}
      </Link>
    );
  }

  return (
    <MembershipLevelCheckoutButton
      level={props.level}
      label={`Get ${MEMBERSHIP_LEVELS[props.level].displayName}`}
      showOrgCode={!props.clubOrgName}
      clubOrgName={props.clubOrgName}
      capFullWaitlist={props.level === "ALL_ACCESS" && !props.allAccessAvailable}
      className="w-full"
    />
  );
}
