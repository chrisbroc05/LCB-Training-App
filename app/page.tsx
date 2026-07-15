import Link from "next/link";
import BrandLogo from "@/app/BrandLogo";
import CoachBioSection from "@/components/CoachBioSection";
import LandingPricingSection from "@/app/LandingPricingSection";

const introVideos = [
  {
    title: "Welcome to LCB Training",
    embedUrl:
      "https://player.vimeo.com/video/1199103395?title=0&byline=0&portrait=0&dnt=1&transparent=0&rel=0",
  },
  {
    title: "How the program works and what to expect",
    embedUrl:
      "https://player.vimeo.com/video/1199103402?title=0&byline=0&portrait=0&dnt=1&transparent=0&rel=0",
  },
  {
    title: "How to submit your swing for analysis",
    embedUrl:
      "https://player.vimeo.com/video/1199103401?title=0&byline=0&portrait=0&dnt=1&transparent=0&rel=0",
  },
];

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

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-gradient-to-br from-[#0f1d34] to-[#050b16] p-5 shadow-2xl shadow-black/60 sm:p-8 md:p-12">
        <div className="relative mb-5 h-12 w-32 sm:mb-6 sm:h-14 sm:w-40">
          <BrandLogo className="object-contain" />
        </div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#7f9434]">
          LCB Training Membership
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl md:text-6xl">
          Build confidence on and off the field with complete player development.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
          LCB Training helps athletes grow as complete competitors through skill training,
          movement work, and accountability that carries into games, school, and everyday life.
          New members start with one free coaching submission and a free 20-minute Player
          Assessment Call with Coach Broc - swing analysis or mental game support with personal
          feedback included.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
          <Link
            href="/auth"
            className="w-full rounded-full bg-[#22c55e] px-6 py-3 text-center font-semibold text-black transition hover:bg-[#35db72] sm:w-auto"
          >
            Join LCB Training
          </Link>
          <Link
            href="/dashboard"
            className="w-full rounded-full border border-[#2b3650] px-6 py-3 text-center font-semibold text-zinc-100 transition hover:border-[#7f9434] hover:text-[#98b144] sm:w-auto"
          >
            Explore Member Dashboard
          </Link>
        </div>
      </section>

      <CoachBioSection />

      <section className="mt-14">
        <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">What We Train</h2>
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
        <h2 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">See What LCB Training Is All About</h2>
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

      <LandingPricingSection />

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
    </div>
  );
}
