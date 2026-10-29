import Link from "next/link";
import { COACH_CALENDLY_URL } from "@/lib/coach-calendly-shared";
import type { AccessUserFields } from "@/lib/access-shared";
import type { DatabaseTier } from "@/lib/membership";
import {
  getDashboardLevelUpSuggestion,
  shouldShowTwelveWeekDashboardUpsell,
  TWELVE_WEEK_DASHBOARD_UPSELL_COPY,
  TWELVE_WEEK_DASHBOARD_UPSELL_PRICE,
} from "@/lib/dashboard-upgrade-copy-shared";

type DashboardUpgradeSectionProps = {
  membershipTier: DatabaseTier;
  access: AccessUserFields;
};

export default function DashboardUpgradeSection({
  membershipTier,
  access,
}: DashboardUpgradeSectionProps) {
  const showTwelveWeek = shouldShowTwelveWeekDashboardUpsell(access);
  const levelSuggestion = getDashboardLevelUpSuggestion(access);

  if (!showTwelveWeek && !levelSuggestion && membershipTier !== "FREE") {
    return null;
  }

  if (membershipTier !== "FREE" && membershipTier !== "BASIC" && !levelSuggestion && !showTwelveWeek) {
    return null;
  }

  return (
    <section className="mt-10 rounded-3xl border border-[#18243a] bg-[#0A1628] px-5 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">
          Ready to Level Up?
        </h2>
        {levelSuggestion ? (
          <p className="mt-2 text-zinc-300">{levelSuggestion.body}</p>
        ) : (
          <p className="mt-2 text-zinc-300">
            {TWELVE_WEEK_DASHBOARD_UPSELL_COPY} {TWELVE_WEEK_DASHBOARD_UPSELL_PRICE}
          </p>
        )}
      </div>

      {levelSuggestion ? (
        <article className="mx-auto mt-8 max-w-xl rounded-2xl border border-[#52B788]/40 bg-[#0b1324]/80 p-5 sm:p-6">
          <h3 className="text-xl font-semibold text-zinc-100">{levelSuggestion.title}</h3>
          <Link
            href={levelSuggestion.href}
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
          >
            {levelSuggestion.buttonLabel}
          </Link>
        </article>
      ) : null}

      {showTwelveWeek ? (
        <article className="mx-auto mt-8 max-w-xl rounded-2xl border border-[#52B788]/40 bg-[#0b1324]/80 p-5 sm:p-6">
          <h3 className="text-xl font-semibold text-zinc-100">12-Week Coaching Program</h3>
          <p className="mt-3 text-sm text-zinc-300">
            {TWELVE_WEEK_DASHBOARD_UPSELL_COPY} {TWELVE_WEEK_DASHBOARD_UPSELL_PRICE}
          </p>
          <Link
            href="/program"
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
          >
            Explore the Program
          </Link>
        </article>
      ) : null}

      {membershipTier === "FREE" ? (
        <article className="mx-auto mt-8 max-w-xl rounded-2xl border border-[#22c55e]/40 bg-[#22c55e]/10 p-5 sm:p-6">
          <h3 className="text-xl font-semibold text-zinc-100">Have questions?</h3>
          <p className="mt-3 text-sm text-zinc-300">
            Want to talk through the 12-Week Program first? Book a call with me.
          </p>
          <a
            href={COACH_CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
          >
            Book a call
          </a>
        </article>
      ) : null}
    </section>
  );
}
