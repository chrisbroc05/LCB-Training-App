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
    <section className="mt-14 rounded-3xl bg-[#0A1628] px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-[#18243a] bg-[#0b1324]/80 px-6 py-10 sm:px-10 sm:py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Meet Your Coach</h2>
          <div className="mx-auto mt-3 h-[2px] w-24 rounded-full bg-[#52B788]" />
        </div>

        <div className="mt-8 text-center">
          <h3 className="text-3xl font-bold text-white sm:text-4xl">Chris Broccolino</h3>
          <p className="mt-2 text-base font-semibold text-[#52B788] sm:text-lg">
            Player Development Coach | LCB Training
          </p>
        </div>

        <div className="mx-auto mt-8 h-px w-full max-w-xl bg-[#52B788]" />

        <div className="mx-auto mt-8 max-w-2xl space-y-5 text-center text-base leading-relaxed text-[#CCCCCC] sm:text-lg">
          <p>
            I was a 120 lb sophomore in high school that nobody recruited. I was overlooked,
            undersized, and written off before I ever got started. But I refused to let that be my
            story.
          </p>
          <p>
            Through relentless work, an unshakeable mindset, and a commitment to getting better every
            single day, I went on to become a 2x All-Conference college athlete, earn multiple Gold
            Glove nominations, and win a NJCAA National Championship at Oakton Community College.
          </p>
          <p>
            That journey taught me everything I know about player development -- and it is exactly why
            I coach the way I do. I do not just train athletes. I build confident, resilient players
            who know how to compete when it matters most. My goal is simple: help every player I work
            with prove the doubters wrong and become the best version of themselves on and off the
            field.
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
          &quot;Work Hard. Be Memorable.&quot;
        </p>
      </div>
    </section>
  );
}
