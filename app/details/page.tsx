import type { Metadata } from "next";
import Link from "next/link";
import BrandLogo from "@/app/BrandLogo";

export const metadata: Metadata = {
  title: "In-Person Baseball Training | LCB Training",
  description:
    "Private and group in-person baseball lessons with Coach Broc in northwest suburban Chicago.",
  robots: {
    index: false,
    follow: false,
  },
};

const lessonPricingCards = [
  {
    title: "1 Player",
    price: "$60 per hour",
    details: "30 or 60 minute sessions available",
  },
  {
    title: "2 Players",
    price: "$75 per hour",
    details: "30 or 60 minute sessions available",
  },
  {
    title: "3 or More Players",
    price: "$100 per hour",
    details: "30 or 60 minute sessions available",
  },
];

const coverageAreas = [
  {
    title: "Hitting",
    description: "Swing mechanics, plate approach, timing, and bat path",
  },
  {
    title: "Fielding",
    description: "Defensive fundamentals, footwork, range, and game instincts",
  },
  {
    title: "Speed and Agility",
    description: "First step quickness, base running, and movement patterns",
  },
  {
    title: "Strength and Mobility",
    description: "Athlete-focused workouts to build power and stay healthy",
  },
];

function CoverageCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 shadow-lg shadow-black/40">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10 text-sm font-bold text-[#9df3bd]">
        {title.charAt(0)}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-300">{description}</p>
    </article>
  );
}

export default function InPersonDetailsPage() {
  // TODO: Replace with in-person booking Calendly link once created
  const bookingUrl = "https://calendly.com/chrisbroc05/30min";

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
        <section className="rounded-3xl border border-[#18243a] bg-gradient-to-br from-[#0f1d34] to-[#050b16] p-5 text-center shadow-2xl shadow-black/60 sm:p-8 md:p-12">
          <div className="mx-auto mb-6 flex justify-center">
            <div className="relative h-12 w-32 sm:h-14 sm:w-40">
              <BrandLogo className="object-contain" />
            </div>
          </div>
          <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl md:text-5xl">
            In-Person Baseball Training with Coach Broc
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            Private and group lessons built around your game. Hitting, fielding, speed and agility,
            and strength and mobility -- all in one place.
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-sm font-medium text-[#98b144] sm:text-base">
            NJCAA National Champion | Current Varsity Head Coach | 12+ Years in Player Development
          </p>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">What I Offer</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {lessonPricingCards.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-6 shadow-lg shadow-black/40"
              >
                <h3 className="text-xl font-semibold text-zinc-100">{card.title}</h3>
                <p className="mt-3 text-2xl font-bold text-[#98b144]">{card.price}</p>
                <p className="mt-3 text-sm text-zinc-300">{card.details}</p>
              </article>
            ))}
          </div>

          <h3 className="mt-12 text-xl font-semibold text-zinc-100 sm:text-2xl">What We Cover</h3>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {coverageAreas.map((area) => (
              <CoverageCard key={area.title} title={area.title} description={area.description} />
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-[#18243a] bg-[#0A1628] p-5 sm:p-6">
            <div className="space-y-3 text-sm text-zinc-300 sm:text-base">
              <p>
                <span className="font-semibold text-zinc-100">Location:</span> Northwest suburban
                Chicago -- facility and local field options available
              </p>
              <p>
                <span className="font-semibold text-zinc-100">Sessions:</span> 30 or 60 minutes --
                flexible scheduling to fit your season
              </p>
              <p>
                <span className="font-semibold text-zinc-100">Availability:</span> Contact Coach
                Broc to check current availability
              </p>
            </div>
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-[#18243a] bg-gradient-to-br from-[#0f1d34] to-[#050b16] px-5 py-12 text-center shadow-2xl shadow-black/60 sm:px-8 sm:py-16">
          <h2 className="text-2xl font-bold text-zinc-100 sm:text-3xl">Ready to Get Started?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            Book your first lesson directly with Coach Broc. Fill out a quick form and pick a time
            that works for you.
          </p>
          <Link
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-8 py-3.5 text-base font-semibold text-black transition hover:bg-[#35db72] sm:w-auto sm:px-10"
          >
            Book a Lesson
          </Link>
        </section>

        <section className="mt-14 rounded-3xl border border-[#24314a] bg-[#111827]/80 px-5 py-10 sm:px-8 sm:py-12">
          <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">
            Can&apos;t Make It In Person?
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            I also offer fully remote coaching through LCB Training. Whether you are across town or
            across the country, you can get personal feedback on your swing, mental game support,
            and access to the full training library -- all from your phone.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-zinc-300 sm:text-base">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#22c55e]" />
              <span>Free 20-minute Player Assessment Call with Coach Broc</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#22c55e]" />
              <span>Membership plans starting at $59 one-time</span>
            </li>
          </ul>
          <Link
            href="https://lcbtraining.com"
            className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-[#22c55e] px-8 py-3 text-base font-semibold text-[#98b144] transition hover:border-[#35db72] hover:text-[#9df3bd] sm:w-auto"
          >
            Explore Remote Training
          </Link>
        </section>

        <footer className="mt-14 border-t border-[#18243a] py-8 text-center">
          <p className="text-sm font-semibold text-zinc-200">LCB Training</p>
          <p className="mt-1 text-sm text-zinc-400">lcbtraining.com</p>
        </footer>
      </div>
    </div>
  );
}
