import Link from "next/link";
import type { KeepBuildingCoachingContext } from "@/lib/coaching-keep-building-shared";

type KeepBuildingSwingCardProps = {
  context: KeepBuildingCoachingContext;
  className?: string;
};

export default function KeepBuildingSwingCard({ context, className = "" }: KeepBuildingSwingCardProps) {
  const drillHref =
    context.libraryDrillIds.length > 0
      ? `/drill-library?drill=${encodeURIComponent(context.libraryDrillIds[0])}`
      : "/drill-library";

  const reportHref = context.lastSubmissionId
    ? `/profile?type=swing&id=${encodeURIComponent(context.lastSubmissionId)}`
    : "/profile";

  return (
    <article className={`rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">Keep building</p>
      <h2 className="mt-2 text-lg font-semibold text-zinc-100">
        Your next swing report opens {context.nextEligibleLabel}.
      </h2>
      <p className="mt-3 text-sm text-zinc-300">
        Until then: work the drills from your last report, follow this week&apos;s focus, and film
        yourself so we can compare.
      </p>
      {context.weeklyFocusTitle ? (
        <p className="mt-2 text-sm text-[#52B788]">This week&apos;s focus: {context.weeklyFocusTitle}</p>
      ) : null}
      {context.areasToImprove.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            When you send your next swing, I&apos;ll check your progress on:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
            {context.areasToImprove.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link
          href={drillHref}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-[#22c55e] px-4 text-sm font-semibold text-black"
        >
          My drills
        </Link>
        <Link
          href={reportHref}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-[#2b3650] px-4 text-sm font-semibold text-zinc-200"
        >
          View my last report
        </Link>
      </div>
    </article>
  );
}
