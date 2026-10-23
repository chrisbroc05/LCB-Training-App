import Link from "next/link";
import { listPublicMembershipLevelDefinitions } from "@/lib/membership-levels-shared";

/**
 * Core / Plus / All-Access pricing grid for public pages. Renders nothing until Phase 2.
 */
export default function PublicMembershipLevelsSection() {
  const levels = listPublicMembershipLevelDefinitions();
  if (levels.length === 0) {
    return null;
  }

  return (
    <section className="mt-14">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Membership levels</h2>
        <p className="mt-2 text-zinc-300">
          Choose the plan that fits your training. Billing opens when you sign up in the app.
        </p>
      </div>
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
            <Link
              href="/auth?mode=signup"
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#35db72]"
            >
              Get started
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
