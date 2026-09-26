import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import ProgramCheckoutSection from "@/app/program/ProgramCheckoutSection";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FREE_SWING_AUTH_URL } from "@/lib/free-swing-flow";
import { PLAYBOOK_PROGRAM_INCLUDED_DESCRIPTION } from "@/lib/playbook-branding";
import {
  TWELVE_WEEK_PROGRAM_NAME,
  TWELVE_WEEK_PROGRAM_PRICE_LABEL,
  twelveWeekProgramIncludes,
} from "@/lib/twelve-week-program";

type ProgramPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 text-[#52B788]"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default async function ProgramPage({ searchParams }: ProgramPageProps) {
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const autoStartCheckout = resolvedSearchParams.startCheckout === "1";

  if (session?.user?.id && autoStartCheckout) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { membershipTier: true },
    });

    if (user?.membershipTier === "TWELVE_WEEK") {
      const enrollment = await prisma.programEnrollment.findUnique({
        where: { userId: session.user.id },
        select: { onboardingCompletedAt: true },
      });

      redirect(enrollment?.onboardingCompletedAt ? "/dashboard" : "/program/start");
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-6 sm:p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#52B788]">
          Flagship Coaching Program
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl md:text-5xl">
          {TWELVE_WEEK_PROGRAM_NAME}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
          12 weeks of structured coaching with Coach Broc. Everything you need to train with
          purpose, get personal feedback, and build habits that last beyond the season.
        </p>

        <div className="mt-8 rounded-2xl border border-[#2b3650] bg-black/30 p-6 sm:p-8">
          <p className="text-sm uppercase tracking-wide text-zinc-400">Full program investment</p>
          <p className="mt-2 text-4xl font-bold text-[#98b144] sm:text-5xl">
            {TWELVE_WEEK_PROGRAM_PRICE_LABEL}
          </p>
          <p className="mt-2 text-sm text-zinc-400">One-time payment for the full 12 weeks</p>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">Everything included</h2>
          <ul className="mt-5 space-y-4">
            {twelveWeekProgramIncludes.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5">
                  <CheckIcon />
                </span>
                <span className="text-sm leading-relaxed text-zinc-200 sm:text-base">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 rounded-2xl border border-[#52B788]/30 bg-[#22c55e]/5 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">
            The Next Level Playbook is included
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-300 sm:text-base">
            {PLAYBOOK_PROGRAM_INCLUDED_DESCRIPTION}
          </p>
        </div>

        <div className="mt-10">
          <ProgramCheckoutSection
            isLoggedIn={Boolean(session?.user)}
            autoStartCheckout={autoStartCheckout}
          />
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-[#18243a] bg-[#0b1324]/50 px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm text-zinc-400">
            Want to try the program first?{" "}
            <Link href={FREE_SWING_AUTH_URL} className="font-semibold text-[#52B788] hover:text-[#9df3bd]">
              Submit a free swing review
            </Link>
          </p>
        </div>

        <div className="mx-auto mt-6 grid max-w-2xl gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-[#2b3650] bg-[#0A1628]/60 p-5 text-center">
            <h3 className="text-base font-semibold text-zinc-200">The Next Level Playbook</h3>
            <p className="mt-2 text-sm text-zinc-400">One-time purchase with lifetime Playbook access.</p>
            <p className="mt-3 text-lg font-semibold text-[#98b144]">$59 one-time</p>
            <Link
              href="/playbook"
              className="mt-4 inline-flex items-center justify-center rounded-full border border-[#52B788]/60 px-4 py-2 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/10"
            >
              Unlock The Playbook
            </Link>
          </article>
          <article className="rounded-xl border border-[#2b3650] bg-[#0A1628]/60 p-5 text-center">
            <h3 className="text-base font-semibold text-zinc-200">Remote Session</h3>
            <p className="mt-2 text-sm text-zinc-400">Book a single live 60-minute video session with Coach Broc.</p>
            <p className="mt-3 text-lg font-semibold text-[#98b144]">$60 / session</p>
            <Link
              href="/remote"
              className="mt-4 inline-flex items-center justify-center rounded-full border border-[#52B788]/60 px-4 py-2 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/10"
            >
              Book a Remote Session
            </Link>
          </article>
        </div>
      </section>
    </div>
  );
}
