"use client";

import Link from "next/link";
import PlaybookPurchaseCta from "@/app/components/PlaybookPurchaseCta";
import { PLAYBOOK_NAME, playbookPrimaryButtonClassName } from "@/lib/playbook-branding";

type FreeMemberWhileYouWaitCardsProps = {
  coachingHref?: string;
  playbookHref?: string;
  usePlaybookCheckout?: boolean;
};

export default function FreeMemberWhileYouWaitCards({
  coachingHref = "/upgrade?reason=memorable-required",
  playbookHref = "/upgrade",
  usePlaybookCheckout = false,
}: FreeMemberWhileYouWaitCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <article className="flex h-full flex-col rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-zinc-100">{PLAYBOOK_NAME}</h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-300">
          Everything Coach Broc knows about this game in one place. The mental game. The physical
          game. The preparation. The life lessons.
        </p>
        <div className="mt-5">
          <PlaybookPurchaseCta
            href={playbookHref}
            useCheckout={usePlaybookCheckout}
            buttonClassName={playbookPrimaryButtonClassName}
          />
        </div>
      </article>

      <article className="flex h-full flex-col rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-zinc-100">1-on-1 Coaching With Coach Broc</h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-300">
          Get personal video feedback every month, weekly accountability check-ins, and direct access
          to Coach Broc between sessions.
        </p>
        <Link
          href={coachingHref}
          className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-[#52B788] bg-transparent px-5 py-2.5 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/10 sm:w-auto"
        >
          See Coaching Options
        </Link>
      </article>
    </div>
  );
}

export function FreeMemberWhileYouWaitSection({
  coachingHref = "/upgrade?reason=memorable-required",
  playbookHref = "/upgrade",
  usePlaybookCheckout = false,
  showDashboardFooter = true,
}: FreeMemberWhileYouWaitCardsProps & {
  showDashboardFooter?: boolean;
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm font-medium text-zinc-200 sm:text-base">
        While you wait -- here is what else is waiting for you.
      </p>
      <FreeMemberWhileYouWaitCards
        coachingHref={coachingHref}
        playbookHref={playbookHref}
        usePlaybookCheckout={usePlaybookCheckout}
      />
      {showDashboardFooter ? (
        <p className="text-center text-sm text-zinc-400">
          Already exploring? Head to your dashboard to see everything included with your free
          account.{" "}
          <Link
            href="/dashboard"
            className="font-semibold text-[#52B788] underline-offset-2 hover:text-[#9df3bd] hover:underline"
          >
            Go to Dashboard
          </Link>
        </p>
      ) : null}
    </div>
  );
}
