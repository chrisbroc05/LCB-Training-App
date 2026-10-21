import Link from "next/link";

export default function DrillLibraryLockLine() {
  return (
    <p className="mt-2 text-center text-sm leading-relaxed text-zinc-400">
      Unlocks with the{" "}
      <Link href="/program" className="font-semibold text-[#52B788] underline underline-offset-2">
        12-Week Program
      </Link>
      . Already own The Playbook? Use code STARTER25 at checkout.
    </p>
  );
}
