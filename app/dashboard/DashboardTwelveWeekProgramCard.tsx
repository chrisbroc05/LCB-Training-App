import Link from "next/link";
import {
  TWELVE_WEEK_PROGRAM_CHECK_IN_CALENDLY_URL,
  TWELVE_WEEK_PROGRAM_NAME,
} from "@/lib/twelve-week-program";

type DashboardTwelveWeekProgramCardProps = {
  programEndsAt: Date | null;
};

function formatProgramEndDate(date: Date | null) {
  if (!date) {
    return "Active";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function DashboardTwelveWeekProgramCard({
  programEndsAt,
}: DashboardTwelveWeekProgramCardProps) {
  return (
    <section className="rounded-2xl border border-[#52B788]/40 bg-[#22c55e]/5 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">
            Your Coaching Program
          </p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-100 sm:text-2xl">
            {TWELVE_WEEK_PROGRAM_NAME}
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            Program access through {formatProgramEndDate(programEndsAt)}.
          </p>
        </div>
        <span className="rounded-full bg-[#22c55e]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">
          Active
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-zinc-300">
        Your program includes full Playbook access, unlimited coaching submissions, workout
        programs, and weekly check-in calls with Coach Broc.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={TWELVE_WEEK_PROGRAM_CHECK_IN_CALENDLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
        >
          Book a Call
        </a>
        <Link
          href="/playbook"
          className="inline-flex items-center justify-center rounded-full border border-[#52B788] px-5 py-2.5 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/10"
        >
          Open The Playbook
        </Link>
        <Link
          href="/coaching-submissions"
          className="inline-flex items-center justify-center rounded-full border border-[#52B788] px-5 py-2.5 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/10"
        >
          Submit for Feedback
        </Link>
      </div>
    </section>
  );
}
