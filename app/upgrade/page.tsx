import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import UpgradePlaybookSection from "@/app/upgrade/UpgradePlaybookSection";
import UpgradePricingSection from "@/app/upgrade/UpgradePricingSection";
import { authOptions } from "@/lib/auth";
import { isTwelveWeekProgramMember, type DatabaseTier } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { TWELVE_WEEK_PROGRAM_NAME } from "@/lib/twelve-week-program";

type UpgradePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UpgradePage({ searchParams }: UpgradePageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth?mode=login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membershipTier: true },
  });
  const membershipTier = (user?.membershipTier ?? "FREE") as DatabaseTier;

  if (isTwelveWeekProgramMember(membershipTier)) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <section className="rounded-3xl border border-[#52B788]/40 bg-[#0b1324]/80 p-8 text-center sm:p-10">
          <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">
            {"You're in the "}
            {TWELVE_WEEK_PROGRAM_NAME}.
          </h1>
          <p className="mt-3 text-sm text-zinc-400">
            Your daily plan, coaching submissions, and full training library are ready.
          </p>
          <Link
            href="/dashboard/today"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[#22c55e] px-6 text-sm font-semibold text-[#0A1628] transition hover:bg-[#35db72]"
          >
            Go to Today
          </Link>
        </section>
      </div>
    );
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const reason = typeof resolvedSearchParams.reason === "string" ? resolvedSearchParams.reason : "";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">
          Keep Training Momentum
        </h1>
        <p className="mt-2 text-zinc-300">
          Lessons are one day a week. The 12-Week Program is what happens the other six.
        </p>
        {reason === "free-submission-used" && (
          <p className="mt-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
            Your one free submission has been used. Join the 12-Week Coaching Program to continue.
          </p>
        )}
        {reason === "basic-required" && (
          <p className="mt-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
            Unlock The Next Level Playbook ($59 one-time) or join the 12-Week Coaching Program for
            the full training library, drill library, and coaching support.
          </p>
        )}
        {reason === "playbook" && (
          <p className="mt-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
            Unlock The Next Level Playbook with a one-time $59 purchase, or get full Playbook access
            with the 12-Week Coaching Program.
          </p>
        )}
        {(reason === "memorable-required" ||
          reason === "pro-required" ||
          reason === "elite-required") && (
          <p className="mt-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
            The 12-Week Coaching Program includes coaching submissions, accountability check-ins,
            and personal feedback from Coach Broc.
          </p>
        )}
      </section>

      <UpgradePricingSection />
      <UpgradePlaybookSection />

      <section className="mt-8 rounded-2xl border border-[#18243a] bg-[#0b1324]/60 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-100">Remote Session</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Book a single live remote session with Coach Broc for swing feedback, mental game support,
          or a focused training plan.
        </p>
        <Link
          href="/remote"
          className="mt-4 inline-flex items-center justify-center rounded-full border border-[#52B788] px-5 py-2.5 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/10"
        >
          Book a Remote Session -- $60
        </Link>
      </section>
    </div>
  );
}
