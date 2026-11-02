import Link from "next/link";
import {
  TWELVE_WEEK_DASHBOARD_UPSELL_COPY,
  TWELVE_WEEK_DASHBOARD_UPSELL_PRICE,
} from "@/lib/dashboard-upgrade-copy-shared";

type DashboardTwelveWeekUpsellCardProps = {
  className?: string;
};

export default function DashboardTwelveWeekUpsellCard({
  className = "",
}: DashboardTwelveWeekUpsellCardProps) {
  return (
    <article
      className={`rounded-2xl border border-[#52B788]/40 bg-[#0b1324]/80 p-5 sm:p-6 ${className}`.trim()}
    >
      <h3 className="text-xl font-semibold text-zinc-100">12-Week Coaching Program</h3>
      <p className="mt-3 text-sm text-zinc-300">
        {TWELVE_WEEK_DASHBOARD_UPSELL_COPY} {TWELVE_WEEK_DASHBOARD_UPSELL_PRICE}
      </p>
      <Link
        href="/program"
        className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72] sm:w-auto"
      >
        Explore the Program
      </Link>
    </article>
  );
}
