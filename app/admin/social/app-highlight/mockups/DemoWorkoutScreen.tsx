import { DEMO_WORKOUT } from "@/app/admin/social/app-highlight/demo-data";

export default function DemoWorkoutScreen() {
  return (
    <div className="space-y-3 p-4">
      <div>
        <p className="text-xs font-bold tracking-wide text-[#52B788]">STRENGTH</p>
        <h3 className="mt-1 text-lg font-semibold text-zinc-100">{DEMO_WORKOUT.title}</h3>
        <p className="mt-1 text-sm text-zinc-400">{DEMO_WORKOUT.subtitle}</p>
      </div>

      <div className="space-y-2">
        {DEMO_WORKOUT.items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-[#2b3650] bg-black/30 px-3 py-3"
          >
            <p className="text-sm font-semibold text-zinc-100">{item.label}</p>
            <p className="text-xs text-zinc-400">{item.detail}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="flex h-11 w-full items-center justify-center rounded-full bg-[#2D6A4F] text-sm font-semibold text-white"
      >
        Mark workout complete
      </button>
    </div>
  );
}
