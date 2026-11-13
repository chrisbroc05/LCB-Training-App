import Link from "next/link";
import { FREE_SWING_LANDING_PATH } from "@/lib/free-swing-flow";

const startFreeCards = [
  {
    title: "Free Swing Analysis",
    description: "Send me one swing and I'll personally break it down.",
    href: FREE_SWING_LANDING_PATH,
    buttonLabel: "Submit My Swing Free",
  },
  {
    title: "Player IQ Quiz",
    description: "15 questions on mindset, game IQ, and training. See where you stand.",
    href: "/quiz",
    buttonLabel: "Take the Quiz",
  },
  {
    title: "Free Guides",
    description: "Pregame routines, nutrition, arm care, and more.",
    href: "/resources",
    buttonLabel: "Get the Guides",
  },
  {
    title: "Fix-It Hitting Plans",
    description: "Front shoulder flying open? Hips drifting? Fix the two problems I see most.",
    href: "/fix-it",
    buttonLabel: "See the Plans",
  },
] as const;

export default function StartFreeSection() {
  return (
    <section id="start-free" className="scroll-mt-site-header border-t border-[#18243a] bg-black">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#52B788]">
            For players and parents
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-100 sm:text-3xl">Start Free</h2>
          <p className="mt-3 text-base leading-relaxed text-zinc-400 sm:text-lg">
            Players get a daily plan and personal feedback from Coach Broc, not another generic drill
            app. Parents know exactly what their player should be working on between lessons. Not
            sure where to start? Pick one.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {startFreeCards.map((card) => (
            <article
              key={card.title}
              className="flex flex-col rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 shadow-lg shadow-black/40"
            >
              <h3 className="text-lg font-semibold text-zinc-100">{card.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-300">{card.description}</p>
              <Link
                href={card.href}
                className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-[#52B788]/60 bg-[#52B788]/10 px-4 py-2.5 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/20"
              >
                {card.buttonLabel}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
