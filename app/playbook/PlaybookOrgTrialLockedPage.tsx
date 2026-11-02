import Link from "next/link";
import { PLAYBOOK_NAME } from "@/lib/playbook-branding";
import type { OrgTrialPlaybookLockedCopy } from "@/lib/org-trial-playbook-locked-shared";

type PlaybookOrgTrialLockedPageProps = {
  copy: OrgTrialPlaybookLockedCopy;
};

export default function PlaybookOrgTrialLockedPage({ copy }: PlaybookOrgTrialLockedPageProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-6 sm:p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#52B788]">
          Team trial
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          {PLAYBOOK_NAME}
        </h1>
        <p className="mt-6 text-base leading-relaxed text-zinc-300">{copy.description}</p>
        <p className="mt-4 text-base leading-relaxed text-zinc-300">{copy.unlockLine}</p>
        {copy.foundingLine ? (
          <p className="mt-3 text-base leading-relaxed text-zinc-300">{copy.foundingLine}</p>
        ) : null}
        <Link
          href="/dashboard"
          className="mt-8 inline-flex items-center justify-center rounded-full border border-[#52B788] px-5 py-2.5 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/10"
        >
          Back to Home
        </Link>
      </section>
    </div>
  );
}
