"use client";

import Link from "next/link";
import { TWELVE_WEEK_PROGRAM_NAME } from "@/lib/twelve-week-program";
import { TWELVE_WEEK_KICKOFF_AND_CHECKINS_SHORT } from "@/lib/twelve-week-program-copy-shared";

type FreeMemberWhileYouWaitCardsProps = {
  programHref?: string;
  fixItHref?: string;
};

export default function FreeMemberWhileYouWaitCards({
  programHref = "/program",
  fixItHref = "/fix-it",
}: FreeMemberWhileYouWaitCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <article className="flex h-full flex-col rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-zinc-100">{TWELVE_WEEK_PROGRAM_NAME}</h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-300">
          Get unlimited coaching submissions, full Playbook access, workout programs, and{" "}
          {TWELVE_WEEK_KICKOFF_AND_CHECKINS_SHORT}.
        </p>
        <Link
          href={programHref}
          className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72] sm:w-auto"
        >
          Explore the Program
        </Link>
      </article>

      <article className="flex h-full flex-col rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-zinc-100">Fix-It Hitting Plans</h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-300">
          Three-week plans with Coach Broc&apos;s drill videos for the swing issues he sees most
          often.
        </p>
        <Link
          href={fixItHref}
          className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-[#52B788] bg-transparent px-5 py-2.5 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/10 sm:w-auto"
        >
          View Fix-It Plans
        </Link>
      </article>
    </div>
  );
}

export function FreeMemberWhileYouWaitSection({
  programHref = "/program",
  fixItHref = "/fix-it",
  showDashboardFooter = true,
}: FreeMemberWhileYouWaitCardsProps & {
  showDashboardFooter?: boolean;
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm font-medium text-zinc-200 sm:text-base">
        While you wait -- here is what else is waiting for you.
      </p>
      <FreeMemberWhileYouWaitCards programHref={programHref} fixItHref={fixItHref} />
      {showDashboardFooter ? (
        <p className="text-center text-sm text-zinc-400">
          Already exploring? Head to your{" "}
          <Link
            href="/dashboard"
            className="font-semibold text-[#52B788] underline-offset-2 hover:text-[#9df3bd] hover:underline"
          >
            dashboard
          </Link>{" "}
          to keep training.
        </p>
      ) : null}
    </div>
  );
}
