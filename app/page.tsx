import Image from "next/image";
import Link from "next/link";
import { membershipTiers } from "@/lib/membership";

const introVideos = [
  {
    title: "Welcome to LCB Training",
    embedUrl:
      "https://player.vimeo.com/video/1199103395?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479",
  },
  {
    title: "How the program works and what to expect",
    embedUrl:
      "https://player.vimeo.com/video/1199103402?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479",
  },
  {
    title: "How to submit your swing for analysis",
    embedUrl:
      "https://player.vimeo.com/video/1199103401?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479",
  },
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-gradient-to-br from-[#0f1d34] to-[#050b16] p-8 shadow-2xl shadow-black/60 md:p-12">
        <div className="relative mb-6 h-14 w-40 overflow-hidden rounded-md border border-[#3b4b6a] bg-[#0f1d34]">
          <Image src="/lcb-training-logo.png" alt="LCB Training Logo" fill className="object-contain p-1" />
        </div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#7f9434]">
          LCB Training Membership
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-zinc-100 md:text-6xl">
          Build confidence on and off the field with complete player development.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-300">
          LCB Training helps athletes grow as complete competitors through skill training,
          movement work, and accountability that carries into games, school, and everyday life.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/auth"
            className="rounded-full bg-[#22c55e] px-6 py-3 font-semibold text-black transition hover:bg-[#35db72]"
          >
            Join LCB Training
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-[#2b3650] px-6 py-3 font-semibold text-zinc-100 transition hover:border-[#7f9434] hover:text-[#98b144]"
          >
            Explore Member Dashboard
          </Link>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-3xl font-semibold text-zinc-100">What We Train</h2>
        <p className="mt-2 max-w-3xl text-zinc-300">
          Every membership is built to improve game performance while developing discipline,
          confidence, and leadership habits beyond baseball.
        </p>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Hitting",
              description: "Better approach, timing, and plate confidence in pressure moments.",
            },
            {
              title: "Fielding",
              description: "Sharper defensive fundamentals, range, and game-ready instincts.",
            },
            {
              title: "Speed & Agility",
              description: "Faster first steps, cleaner movement patterns, and stronger base running.",
            },
            {
              title: "Strength Workouts",
              description: "Athlete-focused strength plans to build power, durability, and resilience.",
            },
          ].map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 shadow-lg shadow-black/40"
            >
              <h3 className="text-lg font-semibold text-zinc-100">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">{pillar.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-3xl font-semibold text-zinc-100">See What LCB Training Is All About</h2>
        <p className="mt-2 max-w-3xl text-zinc-300">
          Start with these intro videos to understand the coaching approach, program flow,
          and how to submit film for feedback.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-3 md:gap-5">
          {introVideos.map((video) => (
            <article
              key={video.embedUrl}
              className="flex h-full w-full flex-col rounded-2xl border border-[#24314a] bg-black/40 p-4 md:mx-auto md:max-w-[320px]"
            >
              <div className="relative w-full overflow-hidden rounded-xl border border-[#2b3650] pt-[177.78%]">
                <iframe
                  src={video.embedUrl}
                  title={video.title}
                  width="640"
                  height="360"
                  frameBorder="0"
                  className="absolute left-0 top-0 h-full w-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <h3 className="mt-4 min-h-12 text-base font-semibold leading-snug text-zinc-100 md:text-lg">
                {video.title}
              </h3>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-zinc-100">Choose Your Membership Tier</h2>
            <p className="mt-2 text-zinc-300">
              Start with the level that fits your training schedule and support needs.
            </p>
          </div>
          <Link href="/auth" className="hidden text-sm font-medium text-[#98b144] md:block">
            Get started now →
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {membershipTiers.map((tier) => (
            <article
              key={tier.key}
              className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-6 shadow-lg shadow-black/40"
            >
              <h3 className="text-xl font-semibold text-zinc-100">{tier.name}</h3>
              <p className="mt-2 text-2xl font-bold text-[#98b144]">{tier.priceLabel}</p>
              <p className="mt-3 text-zinc-300">{tier.summary}</p>
              <ul className="mt-5 space-y-2 text-sm text-zinc-200">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[#22c55e]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
