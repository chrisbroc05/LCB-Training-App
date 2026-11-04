"use client";

import type { ClubReportPayload } from "@/lib/club-report-shared";

type AdminOrgClubReportViewProps = {
  report: ClubReportPayload;
};

function SignupsChart({ points }: { points: ClubReportPayload["signUpsByDay"] }) {
  const maxValue = points.reduce((max, point) => Math.max(max, point.count), 0) || 1;
  const chartHeight = 120;
  const barGap = 1;
  const barCount = points.length;
  const barWidth = barCount > 0 ? (100 - barGap * (barCount - 1)) / barCount : 0;

  return (
    <div className="space-y-3">
      <div
        className="relative w-full overflow-x-auto"
        role="img"
        aria-label="Sign-ups by day since trial start"
      >
        <svg
          viewBox={`0 0 100 ${chartHeight}`}
          preserveAspectRatio="none"
          className="h-[120px] w-full min-w-[280px]"
        >
          {points.map((point, index) => {
            const height =
              point.count > 0 ? Math.max(4, (point.count / maxValue) * (chartHeight - 8)) : 0;
            const x = index * (barWidth + barGap);
            const y = chartHeight - height;
            return (
              <rect
                key={point.dateKey}
                x={x}
                y={y}
                width={barWidth}
                height={height}
                rx={0.6}
                fill="#52B788"
                opacity={0.9}
              >
                <title>{`${point.shortLabel}: ${point.count} sign-up${point.count === 1 ? "" : "s"}`}</title>
              </rect>
            );
          })}
        </svg>
      </div>
      {points.length > 0 ? (
        <div className="flex justify-between text-[10px] text-zinc-500">
          <span>{points[0]?.shortLabel ?? ""}</span>
          <span>{points[points.length - 1]?.shortLabel ?? ""}</span>
        </div>
      ) : null}
    </div>
  );
}

function StatCard(props: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-[#2b3650] bg-black/30 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{props.label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-100">{props.value}</p>
    </div>
  );
}

export default function AdminOrgClubReportView({ report }: AdminOrgClubReportViewProps) {
  const trialRange =
    report.trialStartsLabel && report.trialEndsLabel
      ? `${report.trialStartsLabel} - ${report.trialEndsLabel}`
      : report.trialEndsLabel ?? report.trialStartsLabel ?? "Trial dates not set";

  return (
    <>
      <style>{`
        @media print {
          .admin-portal aside,
          .admin-portal nav[aria-label="Admin sections"],
          .club-report-no-print {
            display: none !important;
          }
          .admin-portal {
            max-width: none !important;
            padding: 0 !important;
          }
          .club-report-sheet {
            border: none !important;
            background: white !important;
            color: black !important;
          }
          .club-report-sheet * {
            color: black !important;
          }
        }
      `}</style>

      <div className="club-report-no-print flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-[#52B788] px-4 py-2 text-sm font-semibold text-black"
        >
          Print / Save as PDF
        </button>
      </div>

      <article className="club-report-sheet mt-4 space-y-8 rounded-2xl border border-[#18243a] bg-[#0b1324]/90 p-5 sm:p-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {report.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={report.logoUrl}
                alt=""
                className="h-16 w-16 rounded-xl border border-[#2b3650] bg-white object-contain p-1"
              />
            ) : null}
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Club report</p>
              <h1 className="text-2xl font-semibold text-zinc-100">{report.orgName}</h1>
              <p className="mt-1 text-sm text-zinc-400">Trial: {trialRange}</p>
            </div>
          </div>
          <p className="text-sm text-zinc-400">
            Report date (Chicago): <span className="text-zinc-200">{report.reportDateLabel}</span>
          </p>
        </header>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Totals</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard label="Total sign-ups" value={report.totals.totalSignUps} />
            <StatCard label="Sign-ups this week" value={report.totals.signUpsThisWeek} />
            <StatCard label="Active last 7 days" value={report.totals.activeLast7Days} />
            <StatCard label="Swing reports requested" value={report.totals.swingReportsRequested} />
            <StatCard label="Swing reports completed" value={report.totals.swingReportsCompleted} />
            <StatCard
              label="Weekly focus weeks published"
              value={report.totals.weeklyFocusWeeksPublished}
            />
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Counts only (no names). Active = opened the app or completed any in-app activity in the
            last 7 days. Test accounts and members marked excluded from club reports are omitted.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">By team</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#2b3650] text-xs uppercase text-zinc-500">
                  <th className="py-2 pr-4 font-medium">Team</th>
                  <th className="py-2 pr-4 font-medium">Sign-ups</th>
                  <th className="py-2 pr-4 font-medium">Active (7d)</th>
                  <th className="py-2 font-medium">Reports completed</th>
                </tr>
              </thead>
              <tbody>
                {report.teams.map((team) => (
                  <tr key={team.teamKey} className="border-b border-[#1a253a] text-zinc-200">
                    <td className="py-2.5 pr-4">{team.teamName}</td>
                    <td className="py-2.5 pr-4">{team.signUps}</td>
                    <td className="py-2.5 pr-4">{team.activeLast7Days}</td>
                    <td className="py-2.5">{team.reportsCompleted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Sign-ups over time
          </h2>
          <p className="mt-1 text-xs text-zinc-500">Daily sign-ups since trial start (Chicago days).</p>
          <div className="mt-3">
            <SignupsChart points={report.signUpsByDay} />
          </div>
        </section>

        {report.showLevelBreakdown ? (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Membership levels
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Trial" value={report.levelCounts.TRIAL} />
              <StatCard label="Core" value={report.levelCounts.CORE} />
              <StatCard label="Plus" value={report.levelCounts.PLUS} />
              <StatCard label="All-Access" value={report.levelCounts.ALL_ACCESS} />
            </div>
          </section>
        ) : null}
      </article>
    </>
  );
}
