import {
  DEMO_WEEK_FOCUS_CUE,
  DEMO_WEEK_FOCUS_NOTE,
} from "@/app/admin/social/app-highlight/demo-data";

export default function DemoFocusCard() {
  return (
    <div className="p-4">
      <section className="rounded-2xl border border-[#52B788]/40 bg-[#0b1324]/80 p-5">
        <p className="text-[10px] font-bold tracking-wide text-[#52B788]">
          THIS WEEK FROM COACH BROC
        </p>
        <p className="mt-2 text-lg font-bold text-zinc-100">{DEMO_WEEK_FOCUS_CUE}</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{DEMO_WEEK_FOCUS_NOTE}</p>
      </section>
    </div>
  );
}
