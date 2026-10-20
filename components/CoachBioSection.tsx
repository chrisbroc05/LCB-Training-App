import Link from "next/link";

import CoachOptionalPhoto from "@/components/CoachOptionalPhoto";
import { BRAND_PRIMARY_SLOGAN } from "@/lib/brand-copy";

const accolades = [
  "NJCAA National Champion - Oakton Community College",
  "Gold Glove Award",
  "2x All-Conference College Athlete",
  "Academic All-American",
  "World Series All-Tournament Team",
];

const experience = [
  "12+ years as a Player Development Coach",
  "Current High School Varsity Coach",
];

export default function CoachBioSection() {
  return (
    <section className="rounded-3xl bg-[#0A1628] px-5 py-12 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-3xl rounded-3xl border border-[#18243a] bg-[#0b1324]/80 px-6 py-10 sm:px-10 sm:py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Meet Coach Broc</h2>
          <div className="mx-auto mt-5 h-[2px] w-24 rounded-full bg-[#52B788]" />
        </div>

        <CoachOptionalPhoto className="mt-8" size={176} roundedClass="rounded-2xl" />

        <div className="mt-8 text-center">
          <h3 className="text-3xl font-bold text-white sm:text-4xl">Chris Broccolino</h3>
          <p className="mt-2 text-base font-semibold text-[#52B788] sm:text-lg">
            Player Development Coach | LCB Training
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-2xl space-y-5 text-base leading-relaxed text-[#CCCCCC] sm:text-lg">
          <p>
            As a player, I was known for more than my stats. I was known for my effort and my love
            for the game. That is the standard I now coach to at LCB Training, and it is why
            everything we do, from swing mechanics to mindset work, points back to one question: what
            do you want to be known for?
          </p>
          <p>
            I have spent 12+ years in player development and I am currently a High School Varsity
            Coach. I know what it takes to help a player physically get to the next level. But the
            players who truly make it are the ones who believe in themselves, love what they are doing,
            and show up with effort that people notice. That is what I build.
          </p>
        </div>

        <div className="mx-auto mt-8 flex max-w-xl flex-col gap-3">
          {accolades.map((accolade) => (
            <div
              key={accolade}
              className="flex min-h-[48px] w-full items-center justify-center border-l-4 border-[#52B788] bg-[#0A1628] px-4 py-3 text-center text-sm font-medium text-white"
            >
              {accolade}
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-2 text-center">
          {experience.map((item) => (
            <p key={item} className="text-base font-medium text-[#CCCCCC]">
              {item}
            </p>
          ))}
        </div>

        <p className="mt-10 text-center text-xl font-bold italic text-[#52B788] sm:text-2xl">
          &quot;{BRAND_PRIMARY_SLOGAN}&quot;
        </p>

        <p className="mt-8 text-center">
          <Link
            href="/coach"
            className="text-base font-semibold text-[#52B788] underline decoration-[#52B788]/40 underline-offset-4 transition hover:text-[#9df3bd] hover:decoration-[#9df3bd]"
          >
            Read my full bio
          </Link>
        </p>
      </div>
    </section>
  );
}
