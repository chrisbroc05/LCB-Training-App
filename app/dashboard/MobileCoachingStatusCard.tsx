import Link from "next/link";
import KeepBuildingSwingCard from "@/app/components/KeepBuildingSwingCard";
import type { KeepBuildingCoachingContext } from "@/lib/coaching-keep-building-shared";
import type { CoachingSubmissionUserFields } from "@/lib/coaching-submissions-shared";
import {
  getHomeCoachingStatus,
  type OrgTrialReportContext,
} from "@/lib/home-coaching-status-shared";

type UnreadResponseNotification = {
  id: number;
  title: string;
  linkUrl: string | null;
};

type MobileCoachingStatusCardProps = {
  coachingUser: CoachingSubmissionUserFields;
  unreadResponse: UnreadResponseNotification | null;
  keepBuilding: KeepBuildingCoachingContext | null;
  orgTrialReport?: OrgTrialReportContext | null;
};

export default function MobileCoachingStatusCard({
  coachingUser,
  unreadResponse,
  keepBuilding,
  orgTrialReport = null,
}: MobileCoachingStatusCardProps) {
  if (unreadResponse) {
    return (
      <article className="mobile-card border-[#22c55e]/50 bg-[#22c55e]/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">
          New Response
        </p>
        <h2 className="mt-2 text-lg font-semibold text-zinc-100">Coach Broc responded</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Your latest coaching feedback is ready to review.
        </p>
        <Link
          href={unreadResponse.linkUrl ?? "/profile"}
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#22c55e] px-4 text-sm font-semibold text-black"
        >
          View Response
        </Link>
      </article>
    );
  }

  if (keepBuilding) {
    return <KeepBuildingSwingCard context={keepBuilding} className="mobile-card border-[#18243a]" />;
  }

  const status = getHomeCoachingStatus({
    user: coachingUser,
    orgTrialReport,
  });

  return (
    <article
      className={`mobile-card ${status.canSubmit ? "border-[#22c55e]/40 bg-[#22c55e]/10" : ""}`}
    >
      <h2 className="text-lg font-semibold text-zinc-100">Coaching Submissions</h2>
      <p className="mt-2 text-sm text-zinc-300">
        <span className="font-semibold text-[#9df3bd]">{status.headline}</span>
      </p>
      {status.detail ? <p className="mt-1 text-xs text-zinc-400">{status.detail}</p> : null}
      <div className="mt-4 space-y-2">
        {status.primaryHref && status.primaryLabel ? (
          <Link
            href={status.primaryHref}
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#22c55e] px-4 text-sm font-semibold text-black"
          >
            {status.primaryLabel}
          </Link>
        ) : null}
        {status.secondaryHref && status.secondaryLabel ? (
          <Link
            href={status.secondaryHref}
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[#2b3650] px-4 text-sm font-semibold text-zinc-200"
          >
            {status.secondaryLabel}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
