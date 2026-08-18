import Link from "next/link";
import { PLAYBOOK_NAME } from "@/lib/playbook-branding";

export default function DashboardPlaybookWelcomeCard() {
  return (
    <section className="mt-6 rounded-2xl border border-[#52B788]/40 bg-[#0A1628] p-5 sm:p-7">
      <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">Start Your Playbook</h2>
      <p className="mt-2 text-sm text-zinc-400 sm:text-base">
        Jump into {PLAYBOOK_NAME} and work through all four interactive chapters at your own pace.
      </p>
      <Link
        href="/playbook"
        className="mt-5 inline-flex h-12 items-center justify-center rounded-full bg-[#22c55e] px-6 text-sm font-semibold text-[#0A1628] transition hover:bg-[#35db72]"
      >
        Begin Chapter 1
      </Link>
    </section>
  );
}
