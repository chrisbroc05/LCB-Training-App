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
            I became a coach because I genuinely love this game and I love working with kids. There
            is nothing better than watching a player put in the work, feel it click, and walk off the
            field with a little more confidence than they had before. That is why I do this.
          </p>
          <p>
            I have spent 12+ years in player development and I am currently a High School Varsity
            Coach. In that time I have worked with players at every level -- from youth rec ball all
            the way up -- and I know what it takes to help a player physically get to the next level.
            The mechanics, the strength, the speed, the fielding -- I know this game and I know how
            to develop players.
          </p>
          <p>
            But I also know that the physical tools only go so far. The players who truly make it are
            the ones who believe in themselves, love what they are doing, and have someone in their
            corner pushing them to be better every single day. That is what I bring to every player I
            work with.
          </p>
          <p>
            The stats will come. The exit velocity will go up. The batting average will improve. But
            what I am really building is a confident, coachable, hungry player who loves this game and
            wants to keep playing it for as long as possible. That is the foundation of everything I
            do at LCB Training.
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
