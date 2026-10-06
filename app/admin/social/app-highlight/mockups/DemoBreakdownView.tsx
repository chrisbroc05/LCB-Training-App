import { DEMO_BREAKDOWN_RESPONSE } from "@/app/admin/social/app-highlight/demo-data";

export default function DemoBreakdownView() {
  return (
    <div className="space-y-3 p-4">
      <div className="overflow-hidden rounded-xl border border-[#2b3650] bg-black/40">
        <div className="flex aspect-video items-center justify-center bg-[#111827]">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#52B788]/20 text-[#52B788]">
              ?
            </div>
            <p className="mt-2 text-xs font-semibold text-zinc-300">Your swing video</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#52B788]/40 bg-[#52B788]/10 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[#52B788]">
          {DEMO_BREAKDOWN_RESPONSE.title}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-200">
          {DEMO_BREAKDOWN_RESPONSE.summary}
        </p>
      </div>

      <div>
        <p className="text-[10px] font-bold tracking-wide text-[#52B788]">RECOMMENDED DRILLS</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DEMO_BREAKDOWN_RESPONSE.drills.map((drill) => (
            <span
              key={drill}
              className="inline-flex rounded-full border border-[#52B788]/50 bg-[#52B788]/10 px-3 py-1 text-xs font-medium text-[#9df3bd]"
            >
              {drill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
