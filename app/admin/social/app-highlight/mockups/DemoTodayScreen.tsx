import {
  DEMO_PLAYER_NAME,
  DEMO_WEEK_NUMBER,
} from "@/app/admin/social/app-highlight/demo-data";

const CARD = "rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4";

const weekDays = [
  { label: "M", status: "complete" },
  { label: "T", status: "complete" },
  { label: "W", status: "partial" },
  { label: "T", status: "today" },
  { label: "F", status: "upcoming" },
  { label: "S", status: "upcoming" },
  { label: "R", status: "rest" },
];

export default function DemoTodayScreen() {
  return (
    <div className="space-y-3 p-3">
      <section className={`${CARD} border-[#2b3650]`}>
        <p className="text-lg font-bold text-zinc-100">
          {DEMO_PLAYER_NAME}, Week {DEMO_WEEK_NUMBER} - Thursday
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#52B788] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#0A1628]">
            Foundation
          </span>
          <span className="rounded-full border border-[#52B788]/40 bg-[#52B788]/10 px-3 py-1 text-[10px] font-semibold text-zinc-100">
            5-day streak
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#0A1628]">
          <div className="h-full w-[33%] rounded-full bg-[#52B788]" />
        </div>
      </section>

      <section className={CARD}>
        <div className="flex items-center justify-between gap-1">
          {weekDays.map((day) => (
            <div key={day.label} className="flex min-w-[42px] flex-col items-center gap-1">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                  day.status === "today"
                    ? "ring-2 ring-[#52B788] text-[#52B788]"
                    : day.status === "complete"
                      ? "bg-[#52B788]/20 text-[#52B788]"
                      : day.status === "rest"
                        ? "text-zinc-500"
                        : "text-zinc-400"
                }`}
              >
                {day.label}
              </div>
              <span className="min-h-[12px] text-[9px] font-semibold text-[#52B788]">
                {day.status === "today" ? "Today" : ""}
              </span>
            </div>
          ))}
        </div>
      </section>

      <article className={CARD}>
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#52B788]/20 text-xs font-bold text-[#52B788]">
            H
          </span>
          <span className="text-[10px] font-bold tracking-wide text-[#52B788]">HITTING</span>
        </div>
        <h3 className="mt-2 text-base font-semibold text-zinc-100">Hitting</h3>
        <p className="mt-1 text-2xl font-bold text-zinc-100">45 swings today</p>
        <p className="mt-1 text-sm text-zinc-300">Focus: Swing path through the middle</p>
      </article>

      <article className={`${CARD} border-l-4 border-l-[#52B788]`}>
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#52B788]/20 text-xs font-bold text-[#52B788]">
            F
          </span>
          <span className="text-[10px] font-bold tracking-wide text-[#52B788]">FIELDING</span>
        </div>
        <h3 className="mt-2 text-base font-semibold text-zinc-100">Fielding</h3>
        <p className="mt-1 text-2xl font-bold text-zinc-100">60 fielding reps today</p>
      </article>
    </div>
  );
}
