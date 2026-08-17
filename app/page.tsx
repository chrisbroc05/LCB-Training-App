import Link from "next/link";
import CoachBioSection from "@/components/CoachBioSection";

const playbookChapters = [
  {
    number: 1,
    title: "The Mental Game",
    description:
      "How to build confidence that does not break, handle slumps without falling apart, and develop the mindset that separates good players from great ones.",
    pullQuotes: [
      "The day I stopped trying to be perfect was the day I started actually playing.",
      "A slump is temporary. It is not permanent.",
      "Going 0 for 4 is just as valuable as going 4 for 4.",
    ],
  },
  {
    number: 2,
    title: "The Physical Game",
    description:
      "The hitting progressions, fielding fundamentals, strength philosophy, and mobility work that builds a complete baseball athlete.",
    pullQuotes: [
      "Become an athlete first. The baseball will come.",
      "If you make practice harder than the game, the game becomes easy.",
      "Good feet make everything else easier.",
    ],
  },
  {
    number: 3,
    title: "The Preparation Game",
    description:
      "How championships are built in practice, what a real pre-game routine looks like, and why the off season decides everything.",
    pullQuotes: [
      "We did not win that championship on game day. We won it in practice.",
      "Your pre-game routine tells your body and your mind that it is time to compete.",
      "The off season is where championships are built.",
    ],
  },
  {
    number: 4,
    title: "The Life Game",
    description:
      "What baseball is really teaching you beyond the stats, and why the lessons you learn on this field will follow you everywhere.",
    pullQuotes: [
      "This game is not just about baseball. It is about becoming the person you want to be.",
      "Don't wait for someone to help you. Go out and do it yourself.",
      "Enjoy every moment. One day it is going to be over.",
    ],
  },
];

const playbookIncludes = [
  "Interactive chapter experience with reflection questions you can save and revisit",
  "Full hitting, fielding, and mindset video drill library",
  "8 downloadable workout programs",
  "Pre-Game Warmup Routine, Nutrition Guide, Mental Game Workbook, and Parent Guide",
  "Downloadable PDF of your completed playbook with your personal reflection answers",
  "New content added regularly as Coach Broc keeps building",
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

function PlaybookAlsoIncludesBox({ items }: { items: string[] }) {
  return (
    <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-[#2b3650] border-l-4 border-l-[#52B788] bg-[#0A1628]/20 px-6 py-8 sm:px-8 sm:py-10">
      <h3 className="text-lg font-bold text-[#52B788] sm:text-xl">Also Includes</h3>
      <ul className="mt-6 space-y-4">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className="mt-0.5">
              <CheckIcon />
            </span>
            <span className="text-sm leading-relaxed text-zinc-200 sm:text-base">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlaybookChapterCard({
  number,
  title,
  description,
  pullQuotes,
}: {
  number: number;
  title: string;
  description: string;
  pullQuotes: string[];
}) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 shadow-lg shadow-black/40 sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#52B788]">
        Chapter {number}
      </p>
      <h3 className="mt-2 text-xl font-bold text-zinc-100">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-300">{description}</p>
      <div className="mt-5 space-y-3">
        {pullQuotes.map((quote) => (
          <p key={quote} className="text-sm italic leading-relaxed text-[#52B788]/90">
            &ldquo;{quote}&rdquo;
          </p>
        ))}
      </div>
    </article>
  );
}

export default function Home() {
  return (
    <>
      <section className="w-full border-b border-[#18243a] bg-gradient-to-br from-[#0A1628] via-[#0f1d34] to-[#050b16]">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 md:py-24">
          <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl md:text-6xl">
            The LCB Training Playbook
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-zinc-300 sm:text-lg md:text-xl">
            Everything I know about this game in one place. The mental game. The physical game. The
            preparation. The life lessons. Written from 12+ years of player development and my own
            experience as a player.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              href="/auth?tier=basic"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-6 py-3 text-center font-semibold text-black transition hover:bg-[#35db72] sm:w-auto"
            >
              Get The Playbook -- $59
            </Link>
            <a
              href="#playbook-chapters"
              className="inline-flex w-full items-center justify-center rounded-full border border-[#52B788] px-6 py-3 text-center font-semibold text-[#52B788] transition hover:bg-[#52B788]/10 sm:w-auto"
            >
              See What Is Inside
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
        <CoachBioSection />

        <section id="playbook-chapters" className="mt-14 scroll-mt-24">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">
              What Is Inside The Playbook
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-zinc-300">
              Four chapters covering everything it takes to become the player and person you want
              to be.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {playbookChapters.map((chapter) => (
              <PlaybookChapterCard
                key={chapter.number}
                number={chapter.number}
                title={chapter.title}
                description={chapter.description}
                pullQuotes={chapter.pullQuotes}
              />
            ))}
          </div>

          <PlaybookAlsoIncludesBox items={playbookIncludes} />
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
      </div>

      <section className="w-full bg-[#0A1628] px-4 py-14 sm:px-6 sm:py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-zinc-100 sm:text-3xl md:text-4xl">
            Ready to get to work?
          </h2>
          <p className="mt-4 text-base text-zinc-300 sm:text-lg">
            One time. Lifetime access. Everything Coach Broc knows about this game.
          </p>
          <Link
            href="/auth?tier=basic"
            className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-8 py-3.5 text-base font-semibold text-black transition hover:bg-[#35db72] sm:w-auto sm:px-10 sm:py-4 sm:text-lg"
          >
            Get The Playbook -- $59
          </Link>
          <p className="mt-5 text-sm text-zinc-400">
            Not ready to commit? Start free and get one personal coaching submission from Coach
            Broc.{" "}
            <Link href="/auth?tier=free" className="font-semibold text-[#52B788] hover:text-[#9df3bd]">
              Start Free
            </Link>
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl border-t border-[#52B788]/30 px-4 pb-14 pt-20 sm:px-6 sm:pb-20 sm:pt-24 md:pb-24">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">
            Want More Than The Playbook?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-zinc-300">
            Take your development further with personal 1-on-1 coaching from Coach Broc.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          <article className="flex h-full flex-col rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-6">
            <h3 className="text-xl font-bold text-zinc-100">Memorable</h3>
            <p className="mt-2 text-2xl font-bold text-[#98b144]">$149/month</p>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-zinc-300">
              Everything in the Playbook plus 2 personal coaching submissions per month, monthly goal
              setting, weekly accountability check-ins, and direct access to Coach Broc.
            </p>
            <Link
              href="/auth?tier=memorable"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-[#52B788] px-5 py-2.5 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/10 sm:w-auto"
            >
              Add Coaching
            </Link>
          </article>

          <article className="flex h-full flex-col rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-6">
            <h3 className="text-xl font-bold text-zinc-100">Elite</h3>
            <p className="mt-2 text-2xl font-bold text-[#98b144]">$249/month</p>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-zinc-300">
              Everything in Memorable plus 4 submissions with rollover, priority 24-hour response,
              personalized monthly development plan, and monthly group coaching call.
            </p>
            <Link
              href="/auth?tier=elite"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-[#52B788] px-5 py-2.5 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/10 sm:w-auto"
            >
              Go Elite
            </Link>
          </article>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-400">
          All coaching memberships include full Playbook access.
        </p>
      </section>
    </>
  );
}
