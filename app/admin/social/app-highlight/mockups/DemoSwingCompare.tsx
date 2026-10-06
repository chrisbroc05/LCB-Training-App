export default function DemoSwingCompare() {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {[
        { label: "Week 1", note: "Long load, barrel leaks early" },
        { label: "Week 12", note: "Stacked, short to ball, finish high" },
      ].map((frame) => (
        <div key={frame.label} className="overflow-hidden rounded-xl border border-[#2b3650] bg-black/40">
          <div className="flex aspect-[3/4] items-end bg-gradient-to-b from-[#1f2937] to-[#0A1628] p-3">
            <div className="w-full">
              <div className="mx-auto mb-8 h-28 w-16 rounded-full bg-[#52B788]/20" />
              <div className="h-1 w-full rounded bg-[#52B788]/60" />
            </div>
          </div>
          <div className="border-t border-[#2b3650] p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[#52B788]">{frame.label}</p>
            <p className="mt-1 text-xs text-zinc-300">{frame.note}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
