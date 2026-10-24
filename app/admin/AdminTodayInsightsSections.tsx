"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";
import type {
  AdminTodayComingUp,
  AdminTodayCoachingLoad,
  AdminTodayGrowth,
  AdminTodayGrowthSeries,
} from "@/lib/admin-today-insights-shared";

type GrowthTab = "leads" | "accounts" | "sales";

function sectionClass() {
  return "admin-page-section space-y-4";
}

function formatChangePercent(changePercent: number | null) {
  if (changePercent === null) {
    return "No prior-period baseline";
  }
  const sign = changePercent > 0 ? "+" : "";
  return `${sign}${changePercent}% vs prior 30 days`;
}

function formatTotal(tab: GrowthTab, series: AdminTodayGrowthSeries) {
  if (tab === "sales") {
    return `$${series.totalCurrent.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }
  return series.totalCurrent.toLocaleString("en-US");
}

function GrowthBarChart({ series, tab }: { series: AdminTodayGrowthSeries; tab: GrowthTab }) {
  const maxValue = useMemo(() => {
    const peak = series.days.reduce((max, point) => Math.max(max, point.value), 0);
    return peak > 0 ? peak : 1;
  }, [series.days]);

  const chartHeight = 120;
  const barGap = 2;
  const barCount = series.days.length;
  const barWidth = barCount > 0 ? (100 - barGap * (barCount - 1)) / barCount : 0;

  return (
    <div className="space-y-3">
      <div
        className="relative w-full overflow-x-auto"
        role="img"
        aria-label={`Daily ${tab} for the last 30 days`}
      >
        <svg
          viewBox={`0 0 100 ${chartHeight}`}
          preserveAspectRatio="none"
          className="h-[120px] w-full min-w-[280px]"
        >
          {series.days.map((point, index) => {
            const height =
              point.value > 0 ? Math.max(4, (point.value / maxValue) * (chartHeight - 8)) : 0;
            const x = index * (barWidth + barGap);
            const y = chartHeight - height;
            return (
              <rect
                key={point.dateKey}
                x={x}
                y={y}
                width={barWidth}
                height={height}
                rx={0.8}
                fill="#52B788"
                opacity={0.85}
              >
                <title>{`${point.shortLabel}: ${tab === "sales" ? `$${point.value}` : point.value}`}</title>
              </rect>
            );
          })}
        </svg>
      </div>
      <div className="flex justify-between text-[10px] text-zinc-500">
        <span>{series.days[0]?.shortLabel ?? ""}</span>
        <span>{series.days[series.days.length - 1]?.shortLabel ?? ""}</span>
      </div>
    </div>
  );
}

function WeekCompareBar(props: { thisWeek: number; lastWeek: number }) {
  const max = Math.max(props.thisWeek, props.lastWeek, 1);
  const thisWidth = Math.round((props.thisWeek / max) * 100);
  const lastWidth = Math.round((props.lastWeek / max) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <span className="w-20 shrink-0">This week</span>
        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#1a253a]">
          <div className="h-full rounded-full bg-[#52B788]" style={{ width: `${thisWidth}%` }} />
        </div>
        <span className="w-8 shrink-0 text-right text-zinc-200">{props.thisWeek}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <span className="w-20 shrink-0">Last week</span>
        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#1a253a]">
          <div className="h-full rounded-full bg-zinc-500" style={{ width: `${lastWidth}%` }} />
        </div>
        <span className="w-8 shrink-0 text-right text-zinc-200">{props.lastWeek}</span>
      </div>
    </div>
  );
}

function ComingUpList(props: {
  title: string;
  emptyLabel: string;
  rows: AdminTodayComingUp["orgTrialsEnding"];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{props.title}</h3>
      {props.rows.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">{props.emptyLabel}</p>
      ) : (
        <ul className="mt-2 divide-y divide-[#18243a] rounded-xl border border-[#18243a]">
          {props.rows.map((row) => (
            <li key={row.id}>
              <Link
                href={row.href}
                className="block px-3 py-3 transition hover:bg-[#1a253a]/60 sm:px-4"
              >
                <p className="text-sm font-medium text-zinc-100">{row.title}</p>
                <p className="mt-0.5 text-xs text-zinc-400">{row.subtitle}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminTodayInsightsSections(props: {
  coachingLoad: AdminTodayCoachingLoad;
  growth: AdminTodayGrowth;
  comingUp: AdminTodayComingUp;
}) {
  const [growthTab, setGrowthTab] = useState<GrowthTab>("leads");

  const activeSeries =
    growthTab === "leads"
      ? props.growth.leads
      : growthTab === "accounts"
        ? props.growth.accounts
        : props.growth.salesDollars;

  const turnaroundLabel =
    props.coachingLoad.averageTurnaroundHours === null
      ? "Not enough data yet"
      : `${props.coachingLoad.averageTurnaroundHours} hrs avg (submit to sent)`;

  return (
    <div className="space-y-6">
      <section className={sectionClass()}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Coaching load
            </h2>
            <p className="mt-1 text-xs text-zinc-500">This week (Mon-Sun, Chicago): {props.coachingLoad.weekLabel}</p>
          </div>
          <Link href={ADMIN_ROUTES.coaching.reviews} className="text-xs font-semibold text-[#52B788]">
            Reviews
          </Link>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#18243a] bg-[#0A1628]/50 p-3">
            <dt className="text-[10px] uppercase tracking-wide text-zinc-500">Video reviews sent</dt>
            <dd className="mt-1 text-xl font-semibold text-zinc-100">
              {props.coachingLoad.videoReviewsSent}
            </dd>
          </div>
          <div className="rounded-xl border border-[#18243a] bg-[#0A1628]/50 p-3">
            <dt className="text-[10px] uppercase tracking-wide text-zinc-500">Written reports sent</dt>
            <dd className="mt-1 text-xl font-semibold text-zinc-100">
              {props.coachingLoad.writtenReportsSent}
            </dd>
          </div>
          <div className="col-span-2 rounded-xl border border-[#18243a] bg-[#0A1628]/50 p-3 sm:col-span-1">
            <dt className="text-[10px] uppercase tracking-wide text-zinc-500">Turnaround</dt>
            <dd className="mt-1 text-sm font-semibold text-zinc-100">{turnaroundLabel}</dd>
          </div>
        </dl>

        <div className="mt-4 rounded-xl border border-[#18243a] bg-[#0A1628]/40 p-3">
          <p className="text-xs font-semibold text-zinc-300">Reports coming</p>
          <p className="mt-1 text-sm text-zinc-400">
            {props.coachingLoad.reportsOpeningNext7Days} CORE windows open in the next 7 days |{" "}
            {props.coachingLoad.pendingWrittenReports} already in the reports queue
          </p>
          <Link
            href={ADMIN_ROUTES.coaching.reports}
            className="mt-2 inline-flex text-xs font-semibold text-[#52B788]"
          >
            Open reports queue
          </Link>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Coaching sent (video + written)
          </p>
          <WeekCompareBar
            thisWeek={props.coachingLoad.thisWeekTotalSent}
            lastWeek={props.coachingLoad.lastWeekTotalSent}
          />
        </div>
      </section>

      <section className={sectionClass()}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Growth, last 30 days
        </h2>
        <p className="text-xs text-zinc-500">Daily totals in America/Chicago. Sales are paid resource purchases.</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["leads", "New leads"],
              ["accounts", "New accounts"],
              ["sales", "Sales ($)"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setGrowthTab(id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                growthTab === id
                  ? "bg-[#22c55e] text-black"
                  : "border border-[#2b3650] text-zinc-300 hover:text-[#9df3bd]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <GrowthBarChart series={activeSeries} tab={growthTab} />

        <div className="rounded-xl border border-[#18243a] bg-[#0A1628]/40 p-3">
          <p className="text-2xl font-semibold text-zinc-100">{formatTotal(growthTab, activeSeries)}</p>
          <p className="mt-1 text-sm text-zinc-400">{formatChangePercent(activeSeries.changePercent)}</p>
          <Link
            href={
              growthTab === "sales"
                ? ADMIN_ROUTES.business.sales
                : growthTab === "accounts"
                  ? ADMIN_ROUTES.players.members
                  : ADMIN_ROUTES.business.leads
            }
            className="mt-2 inline-flex text-xs font-semibold text-[#52B788]"
          >
            {growthTab === "accounts"
              ? "View members"
              : growthTab === "sales"
                ? "View sales"
                : "View leads"}
          </Link>
        </div>
      </section>

      <section className={sectionClass()}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Coming up this week
        </h2>
        <p className="text-xs text-zinc-500">Read-only reminders with quick links.</p>

        <div className="mt-4 space-y-6">
          <ComingUpList
            title="Org trials ending (14 days)"
            emptyLabel="No org trials ending soon."
            rows={props.comingUp.orgTrialsEnding}
          />
          <ComingUpList
            title="12-Week start or finish (7 days)"
            emptyLabel="No program starts or finishes this week."
            rows={props.comingUp.twelveWeekStartOrFinish}
          />
          <ComingUpList
            title="CORE report windows this week"
            emptyLabel="No CORE report windows open this week."
            rows={props.comingUp.coreReportsDue}
          />
          <ComingUpList
            title="Minors waiting on parent confirmation"
            emptyLabel="No pending parent confirmations."
            rows={props.comingUp.unconfirmedMinors}
          />
        </div>
      </section>
    </div>
  );
}
