import Link from "next/link";
import KeepBuildingSwingCard from "@/app/components/KeepBuildingSwingCard";
import { resolveEffectiveLevel } from "@/lib/access-shared";
import { getCoachingQuotaDisplayCopy } from "@/lib/coaching-quota-display-shared";
import type { KeepBuildingCoachingContext } from "@/lib/coaching-keep-building-shared";
import type { CoachingSubmissionUserFields } from "@/lib/coaching-submissions-shared";
import { getCoachingSubmissionAvailability } from "@/lib/coaching-submissions-shared";

type UnreadResponseNotification = {
  id: number;
  title: string;
  linkUrl: string | null;
};

type MobileCoachingStatusCardProps = {
  coachingUser: CoachingSubmissionUserFields;
  unreadResponse: UnreadResponseNotification | null;
  keepBuilding: KeepBuildingCoachingContext | null;
};

export default function MobileCoachingStatusCard({
  coachingUser,
  unreadResponse,
  keepBuilding,
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

  const effective = resolveEffectiveLevel(coachingUser);
  const copy = getCoachingQuotaDisplayCopy(coachingUser);
  const availability = getCoachingSubmissionAvailability(coachingUser);
  const canSubmit = availability.canSubmit;

  if (keepBuilding) {
    return <KeepBuildingSwingCard context={keepBuilding} className="mobile-card border-[#18243a]" />;
  }

  if (effective === "FREE" && !canSubmit) {
    return (
      <article className="mobile-card">
        <h2 className="text-lg font-semibold text-zinc-100">Coaching Submissions</h2>
        <p className="mt-2 text-sm text-zinc-300">{copy.headline}</p>
        {copy.detail ? <p className="mt-1 text-xs text-zinc-400">{copy.detail}</p> : null}
        <Link
          href="/program"
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full border border-[#2b3650] px-4 text-sm font-semibold text-zinc-200"
        >
          Join the 12-Week Program
        </Link>
      </article>
    );
  }

  return (
    <article
      className={`mobile-card ${canSubmit ? "border-[#22c55e]/40 bg-[#22c55e]/10" : ""}`}
    >
      <h2 className="text-lg font-semibold text-zinc-100">Coaching Submissions</h2>
      <p className="mt-2 text-sm text-zinc-300">
        <span className="font-semibold text-[#9df3bd]">{copy.headline}</span>
      </p>
      {copy.detail ? <p className="mt-1 text-xs text-zinc-400">{copy.detail}</p> : null}
      {canSubmit ? (
        <Link
          href="/coaching-submissions"
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#22c55e] px-4 text-sm font-semibold text-black"
        >
          Submit Now
        </Link>
      ) : (
        <Link
          href="/settings"
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full border border-[#2b3650] px-4 text-sm font-semibold text-zinc-200"
        >
          View membership
        </Link>
      )}
    </article>
  );
}
