/**
 * Brand reinforcement opportunities elsewhere in the app:
 * 1. Dashboard welcome (app/dashboard/page.tsx) -- echo the secondary tagline beneath "welcome back"
 * 2. Site footer (app/layout.tsx) -- add "What do you want to be known for?" under the primary slogan
 * 3. Coaching submission flow -- a one-line prompt before upload: "What do you want this work to say about you?"
 */
import Link from "next/link";
import { getServerSession } from "next-auth";
import BrandStorySection from "@/components/BrandStorySection";
import CoachBioSection from "@/components/CoachBioSection";
import { authOptions } from "@/lib/auth";
import { BRAND_PRIMARY_SLOGAN, BRAND_SECONDARY_TAGLINE } from "@/lib/brand-copy";
import { PLAYBOOK_STANDALONE_DESCRIPTION } from "@/lib/playbook-branding";
import {
  TWELVE_WEEK_PROGRAM_NAME,
  twelveWeekProgramLandingHighlights,
} from "@/lib/twelve-week-program";
import { toVimeoEmbedUrl } from "@/lib/vimeo";

const testimonials = [
  {
    quote:
      "What sets LCB Training apart is the intention behind the expertise. It's not just about mechanics - it's about building strength, sharpening mindset, and mastering strategy. The week-to-week data tracking keeps us motivated, and the results speak for themselves. My son's confidence - and the whole team's - has skyrocketed.",
    attribution: "Parent of a Freshman 3rd Baseman",
  },
  {
    quote:
      "Hey Chris, thanks for today. My son feels great and is acting more confident - so appreciate you and all the time you put in with him.",
    attribution: "Parent of a 12-Year-Old Player",
  },
  {
    quote:
      "I hit around .350 and batted leadoff for most of the season. That's way better than in the past. I'm definitely happy with the season - especially with my hitting performance.",
    attribution: "Varsity Infielder, Class of 2026",
  },
  {
    quote:
      "My team could not stop talking about your training and would love to have you back again.",
    attribution: "Coach, 15U Baseball Team",
  },
  {
    quote:
      "After your lesson with my son, he was actually very excited. The next game he went 3 for 3 and got in the car and said 'I did what Coach Chris taught me and it worked!'",
    attribution: "Parent of a 13U Player",
  },
];

const physicalTrainingPillars = [
  {
    title: "Hitting",
    description:
      "Better mechanics, sharper timing, and the plate confidence to compete in pressure moments.",
  },
  {
    title: "Fielding",
    description:
      "Stronger fundamentals, better range, and the instincts to make plays when it matters most.",
  },
  {
    title: "Speed and Agility",
    description:
      "Faster first steps, cleaner movement patterns, and the athleticism to impact the game on the bases and in the field.",
  },
  {
    title: "Strength and Conditioning",
    description:
      "Athlete-focused strength programs built to add power, build durability, and keep you healthy all season long.",
  },
];

const LANDING_HERO_VIMEO_URL = "https://player.vimeo.com/video/1229592201?h=0359db07df";
const landingHeroEmbedUrl = toVimeoEmbedUrl(LANDING_HERO_VIMEO_URL);

const mentalEdgePillars = [
  {
    title: "Confidence and Self Belief",
    description:
      "Confidence is a skill. It is not something you are born with. We help players build genuine belief in themselves through repetition, positive reinforcement, and learning to trust their training when the game is on the line.",
  },
  {
    title: "Resilience and Adversity",
    description:
      "Every player fails. Every player goes through slumps. What separates the good ones from the great ones is how they respond. We teach players to reset, bounce back, and use adversity as fuel.",
  },
  {
    title: "Focus and Routine",
    description:
      "Elite performance starts with elite preparation. We help players build pre-game routines, develop focus under pressure, and stay locked in from first pitch to last out.",
  },
];

function TrainingPillarCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 shadow-lg shadow-black/40">
      <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-300">{description}</p>
    </article>
  );
}

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

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = Boolean(session?.user);

  return (
    <>
      <section className="w-full bg-gradient-to-br from-[#0A1628] via-[#0f1d34] to-[#050b16]">
        <div className="mx-auto w-full max-w-4xl px-4 py-12 text-center sm:px-6 sm:py-16 md:py-20">
          {!isLoggedIn ? (
            <p className="mb-6 text-sm text-zinc-400">
              Already have an account?{" "}
              <Link
                href="/auth?mode=login"
                className="font-semibold text-[#52B788] transition hover:text-[#9df3bd]"
              >
                Log In
              </Link>
            </p>
          ) : null}
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            {BRAND_PRIMARY_SLOGAN}
          </h1>
          <p className="mt-5 text-xl font-medium text-[#52B788] sm:text-2xl md:text-3xl">
            {BRAND_SECONDARY_TAGLINE}
          </p>

          {landingHeroEmbedUrl ? (
            <div className="mx-auto mt-8 w-full sm:mt-10 md:mt-12 md:max-w-[400px]">
              <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-[#2b3650] bg-black shadow-2xl shadow-black/40">
                <iframe
                  src={landingHeroEmbedUrl}
                  title="LCB Training intro video"
                  className="absolute inset-0 h-full w-full border-0"
                  allow="fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <BrandStorySection />

      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-12 md:pb-20 md:pt-14">
        <CoachBioSection />

        <section id="twelve-week-program" className="mt-14 scroll-mt-24">
          <div className="rounded-3xl border border-[#52B788]/30 bg-[#0A1628] px-5 py-10 sm:px-8 sm:py-12 md:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl md:text-4xl">
                {TWELVE_WEEK_PROGRAM_NAME}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-300 sm:text-lg">
                12 weeks of structured coaching with Coach Broc. Train with purpose, get personal
                feedback on every swing and mental game submission, and build habits that last beyond
                the season.
              </p>
            </div>

            <ul className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
              {twelveWeekProgramLandingHighlights.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 text-left"
                >
                  <span className="mt-0.5">
                    <CheckIcon />
                  </span>
                  <span className="text-sm leading-relaxed text-zinc-200 sm:text-base">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col items-center gap-4">
              <Link
                href="/program"
                className="inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#35db72] sm:w-auto"
              >
                Get Started
              </Link>
              <p className="max-w-xl text-center text-sm text-zinc-400">
                Not ready yet? Start with one free coaching submission from Coach Broc.{" "}
                <Link href="/auth?tier=free" className="font-semibold text-[#52B788] hover:text-[#9df3bd]">
                  Submit My Swing Free
                </Link>
              </p>
            </div>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">What We Train</h2>
          <p className="mt-2 max-w-3xl text-zinc-300">
            Everything we work on is designed to make you better on the field. The habits, the
            discipline, and the confidence you build here will carry into every part of your life.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {physicalTrainingPillars.map((pillar) => (
              <TrainingPillarCard
                key={pillar.title}
                title={pillar.title}
                description={pillar.description}
              />
            ))}
          </div>

          <div className="mt-10 text-center">
            <div className="mx-auto mb-6 h-px w-24 bg-[#52B788]" />
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-zinc-200 sm:text-xl">
              But the physical tools only go so far. The players who truly make it are the ones who
              have mastered what happens between the ears.
            </p>
          </div>

          <p className="mt-10 text-center text-sm font-semibold uppercase tracking-wide text-[#52B788]">
            The Mental Edge
          </p>

          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
            {mentalEdgePillars.map((pillar) => (
              <TrainingPillarCard
                key={pillar.title}
                title={pillar.title}
                description={pillar.description}
              />
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-3xl bg-[#0A1628] px-5 py-14 sm:px-8 sm:py-16 md:px-12 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-2xl font-bold text-zinc-100 sm:text-3xl">
              What Players &amp; Parents Are Saying
            </h2>
            <div className="mx-auto mt-4 h-[2px] w-28 rounded-full bg-[#52B788]" />
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {testimonials.map((testimonial) => (
              <article
                key={testimonial.attribution}
                className="flex h-full flex-col rounded-2xl border border-[#1f2e4b] bg-[#111f37] p-6 shadow-lg shadow-black/30"
              >
                <p className="text-5xl font-bold leading-none text-[#52B788]">&ldquo;</p>
                <p className="mt-3 flex-1 text-[15px] italic leading-relaxed text-zinc-100 sm:text-base">
                  {testimonial.quote}
                </p>
                <p className="mt-6 text-sm font-medium text-[#52B788]">
                  &mdash; {testimonial.attribution}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-[#18243a] bg-[#0b1324]/50 px-5 py-8 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-lg font-semibold text-zinc-300 sm:text-xl">
              Not ready for the full program? Start here.
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Two standalone options if you want to begin without the full 12-week commitment.
            </p>
          </div>
          <div className="mx-auto mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
            <article className="rounded-xl border border-[#2b3650] bg-[#0A1628]/60 p-5">
              <h3 className="text-base font-semibold text-zinc-200">The Next Level Playbook</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {PLAYBOOK_STANDALONE_DESCRIPTION}
              </p>
              <Link
                href="/playbook"
                className="mt-4 inline-flex items-center justify-center rounded-full border border-[#52B788]/60 px-4 py-2 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/10"
              >
                Unlock The Playbook
              </Link>
            </article>
            <article className="rounded-xl border border-[#2b3650] bg-[#0A1628]/60 p-5">
              <h3 className="text-base font-semibold text-zinc-200">Remote Session</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Book a single live 60-minute video session with Coach Broc.
              </p>
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

    </>
  );
}
