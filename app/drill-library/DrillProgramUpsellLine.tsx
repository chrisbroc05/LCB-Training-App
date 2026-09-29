import Link from "next/link";

export default function DrillProgramUpsellLine() {
  return (
    <p className="mt-4 text-center text-sm leading-relaxed text-zinc-400">
      Want the full library and a daily plan?{" "}
      <Link href="/program" className="font-semibold text-[#52B788] underline underline-offset-2">
        See the 12-Week Program
      </Link>
      .
    </p>
  );
}
