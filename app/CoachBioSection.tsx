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
    <section className="mt-14 rounded-3xl bg-[#F5F5F5] px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-3xl rounded-3xl border border-[#d9e2ef] bg-white px-6 py-10 shadow-lg shadow-[#0A1628]/10 sm:px-10 sm:py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#0A1628] sm:text-3xl">Meet Your Coach</h2>
          <div className="mx-auto mt-3 h-[2px] w-24 rounded-full bg-[#52B788]" />
        </div>

        <div className="mt-8 text-center">
          <h3 className="text-3xl font-bold text-[#0A1628] sm:text-4xl">Chris Broccolino</h3>
          <p className="mt-2 text-base font-semibold text-[#52B788] sm:text-lg">
            Player Development Coach | LCB Training
          </p>
        </div>

        <div className="mx-auto mt-8 h-px w-full max-w-xl bg-[#52B788]" />

        <p className="mx-auto mt-8 max-w-2xl text-center text-base leading-relaxed text-[#334155] sm:text-lg">
          I have spent 12+ years working with baseball players at every level - helping them not
          just become better athletes, but more confident people. As a current High School Varsity
          Coach, my goal is simple: build confidence on and off the field. Every player I work with
          gets my full attention, honest feedback, and a plan built around their individual
          development.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {accolades.map((accolade) => (
            <span
              key={accolade}
              className="rounded-full bg-[#0A1628] px-4 py-2.5 text-center text-sm font-medium text-white"
            >
              {accolade}
            </span>
          ))}
        </div>

        <div className="mt-8 space-y-2 text-center">
          {experience.map((item) => (
            <p key={item} className="text-base font-medium text-[#0A1628]">
              {item}
            </p>
          ))}
        </div>

        <p className="mt-10 text-center text-xl font-bold italic text-[#52B788] sm:text-2xl">
          "Work Hard. Be Memorable."
        </p>
      </div>
    </section>
  );
}
