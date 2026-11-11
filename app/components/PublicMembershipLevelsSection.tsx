import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MembershipLevelCheckoutButton from "@/app/components/MembershipLevelCheckoutButton";
import MembershipLevelSignupLink from "@/app/components/MembershipLevelSignupLink";
import { listPublicMembershipLevelDefinitions } from "@/lib/membership-levels-shared";
import { isAllAccessCheckoutAvailable } from "@/lib/membership-subscription-server";
import { TWELVE_WEEK_PROGRAM_PRICE_LABEL } from "@/lib/twelve-week-program";

export default async function PublicMembershipLevelsSection() {
  const levels = listPublicMembershipLevelDefinitions();
  const session = await getServerSession(authOptions);
  const allAccessAvailable =
    levels.length > 0 ? await isAllAccessCheckoutAvailable() : false;

  return (
    <section id="plans" className="scroll-mt-site-header mt-14">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Plans and Programs</h2>
        {levels.length > 0 ? (
          <p className="mt-2 text-zinc-300">Core, Plus, and All-Access. Billed monthly in the app.</p>
        ) : (
          <p className="mt-2 text-zinc-300">
            Coaching built around how you train. Start with the 12-Week Program.
          </p>
        )}
      </div>

      {levels.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-3">
          {levels.map((level) => (
            <article
              key={level.key}
              className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-6 shadow-lg shadow-black/40"
            >
              <h3 className="text-xl font-semibold text-zinc-100">{level.displayName}</h3>
              <p className="mt-1 text-sm font-medium text-[#52B788]">{level.tagline}</p>
              <p className="mt-3 text-2xl font-bold text-[#98b144]">{level.priceDisplay}</p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">{level.shortDescription}</p>
              <div className="mt-5">
                {session?.user?.id ? (
                  <MembershipLevelCheckoutButton
                    level={level.key}
                    capFullWaitlist={level.key === "ALL_ACCESS" && !allAccessAvailable}
                  />
                ) : (
                  <MembershipLevelSignupLink level={level.key} />
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <article className="mt-6 w-full rounded-2xl border border-[#52B788]/50 bg-[#22c55e]/10 p-6 shadow-lg shadow-black/30 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9df3bd]">
          Want it built for you?
        </p>
        <h3 className="mt-3 text-2xl font-semibold text-zinc-100 sm:text-3xl">
          12-Week Coaching Program
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-300 sm:text-base">
          A personalized daily plan, weekly video breakdowns, and direct messaging with Coach Broc
          for 12 weeks.
        </p>
        <p className="mt-4 text-xl font-bold text-[#98b144]">
          {TWELVE_WEEK_PROGRAM_PRICE_LABEL} one time
        </p>
        <Link
          href="/program"
          className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#22c55e] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#35db72] sm:w-auto"
        >
          See the Program
        </Link>
      </article>
    </section>
  );
}
