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
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Meet Your Coach</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-400 sm:text-base">
            This is the standard I coach to -- because I lived it.
          </p>
          <div className="mx-auto mt-3 h-[2px] w-24 rounded-full bg-[#52B788]" />
        </div>

        <div className="mt-8 text-center">
          <h3 className="text-3xl font-bold text-white sm:text-4xl">Chris Broccolino</h3>
          <p className="mt-2 text-base font-semibold text-[#52B788] sm:text-lg">
            Player Development Coach | LCB Training
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-2xl space-y-5 text-base leading-relaxed text-[#CCCCCC] sm:text-lg">
          <p>
            When I was about ten years old playing travel baseball, an opposing coach approached my
            dad the following weekend and said he remembered me. Not for a great hit -- for two things.
          </p>
          <p>
            First, that I hustled down the line on a routine ground ball to second base and almost
            beat it out. Second, that on a different play I hit what would normally be a routine pop
            up, but I hustled out of the box so hard that I was standing on second base by the time the
            center fielder caught it. If he had dropped it, I likely would have had a triple instead
            of an easy out.
          </p>
          <p>
            That coach did not remember me for stats. He remembered me for effort. That is the
            standard I now coach to at LCB Training -- and it is why everything we do, from swing
            mechanics to mindset work, points back to the same question: what do you want to be known
            for?
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
      </div>
    </section>
  );
}
