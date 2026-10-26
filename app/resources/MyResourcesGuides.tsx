"use client";

import Link from "next/link";
import type { MyResourceGuidesSection } from "@/lib/my-resources-shared";

type MyResourcesGuidesProps = {
  section: MyResourceGuidesSection;
};

function GuideIcon() {
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#2b3650] bg-[#132038] text-xs font-bold uppercase tracking-wide text-[#52B788]"
      aria-hidden
    >
      PDF
    </span>
  );
}

export default function MyResourcesGuides({ section }: MyResourcesGuidesProps) {
  return (
    <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-6">
      <h2 className="text-xl font-semibold text-zinc-100">{section.title}</h2>
      <ul className="mt-4 space-y-2">
        {section.guides.map((guide) => (
          <li key={guide.id}>
            <div className="flex min-h-[56px] items-center gap-3 rounded-xl border border-[#2b3650] bg-black/25 px-3 py-2 sm:px-4">
              <GuideIcon />
              <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-zinc-100">
                {guide.name}
              </p>
              <Link
                href={guide.viewerHref}
                className="resources-action-pill shrink-0 px-5 text-sm"
              >
                Open
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
