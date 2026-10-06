export default function DemoPushNotification() {
  return (
    <div className="flex min-h-[520px] items-center justify-center bg-[#111827] p-6">
      <div className="w-full max-w-[360px] rounded-3xl border border-white/10 bg-black/70 p-4 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0A1628]">
            <span className="text-xs font-bold text-[#52B788]">LCB</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              LCB Training
            </p>
            <p className="mt-1 text-base font-semibold text-white">Today&apos;s work is ready</p>
            <p className="mt-1 text-sm text-zinc-300">
              Jake, Week 4 is live. Hit your swings, fielding, and strength work.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
