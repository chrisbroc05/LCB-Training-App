"use client";

import PlaybookPurchaseCta from "@/app/components/PlaybookPurchaseCta";
import {
  PLAYBOOK_LANDING_SUBHEADLINE,
  PLAYBOOK_NAME,
} from "@/lib/playbook-branding";
import {
  FREE_PREVIEW_SECTION_COUNT,
  PLAYBOOK_CHAPTERS,
  type PlaybookSection,
} from "@/lib/playbook-content";
import { playbookLockedMessage } from "@/lib/membership";

function SectionContent({ section }: { section: PlaybookSection }) {
  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold text-[#52B788]">{section.title}</h3>
      {section.paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 40)} className="text-base leading-relaxed text-zinc-100">
          {paragraph}
        </p>
      ))}
      {section.pullQuote ? (
        <blockquote className="border-l-4 border-[#52B788] bg-[#52B788]/10 px-4 py-3 text-base italic text-zinc-100">
          {section.pullQuote}
        </blockquote>
      ) : null}
      {section.calloutTitle && section.calloutText ? (
        <div className="rounded-xl border border-[#2b3650] bg-black/30 p-4">
          <p className="font-semibold text-[#52B788]">{section.calloutTitle}</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-200">{section.calloutText}</p>
        </div>
      ) : null}
      {section.bulletList ? (
        <ul className="list-disc space-y-2 pl-5 text-zinc-100">
          {section.bulletList.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function LockIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className="text-[#52B788]"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function PlaybookFreePreview() {
  const chapter = PLAYBOOK_CHAPTERS[0];
  const previewSections = chapter.sections.slice(0, FREE_PREVIEW_SECTION_COUNT);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#52B788]">
          Chapter 1 Preview
        </p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-100 sm:text-3xl">{PLAYBOOK_NAME}</h1>
        <p className="mt-3 text-zinc-300">{PLAYBOOK_LANDING_SUBHEADLINE}</p>
        <h2 className="mt-8 text-xl font-semibold text-zinc-100">
          Chapter 1: {chapter.title}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">{chapter.subtitle}</p>
      </section>

      <div className="relative mt-8 space-y-8 rounded-3xl border border-[#18243a] bg-[#0A1628] p-5 sm:p-8">
        {previewSections.map((section) => (
          <SectionContent key={section.title} section={section} />
        ))}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0A1628] via-[#0A1628]/90 to-transparent"
        />
      </div>

      <section className="mt-8 rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-6 text-center sm:p-8">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4">
          <LockIcon />
          <p className="text-base text-zinc-200">{playbookLockedMessage}</p>
          <PlaybookPurchaseCta useCheckout align="center" />
        </div>
      </section>
    </div>
  );
}
