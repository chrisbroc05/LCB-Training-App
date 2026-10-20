import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import CoachOptionalPhoto from "@/components/CoachOptionalPhoto";
import {
  COACH_BIO_PDF_HREF,
  coachBioCalendlyUrl,
  coachBioContent,
  coachBioPageDescription,
  getCoachOfferingLink,
} from "@/lib/coach-bio-content";
import { coachHeadshotFileExists } from "@/lib/coach-photo-shared";
import { getPublicAppUrl } from "@/lib/public-app-url";

const siteUrl = getPublicAppUrl();

export const metadata: Metadata = {
  title: "Coach Broc | LCB Training",
  description: coachBioPageDescription,
  openGraph: {
    title: "Coach Broc | LCB Training",
    description: coachBioPageDescription,
    url: `${siteUrl}/coach`,
    siteName: "LCB Training",
    type: "profile",
    images: coachHeadshotFileExists()
      ? [
          {
            url: `${siteUrl}/images/coach-broc.jpg`,
            width: 800,
            height: 800,
            alt: "Coach Broc - Chris Broccolino",
          },
        ]
      : undefined,
  },
  twitter: {
    card: "summary_large_image",
    title: "Coach Broc | LCB Training",
    description: coachBioPageDescription,
    images: coachHeadshotFileExists() ? [`${siteUrl}/images/coach-broc.jpg`] : undefined,
  },
};

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#52B788]">{children}</p>
  );
}

function OfferingCard({
  title,
  summary,
}: {
  title: string;
  summary: string;
}) {
  const link = getCoachOfferingLink(title);
  const cardBody = (
    <article className="flex h-full flex-col rounded-2xl border border-[#18243a] bg-[#F5F5F5]/5 p-5 backdrop-blur-sm transition hover:border-[#52B788]/45">
      <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
      {summary ? (
        <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">{summary}</p>
      ) : null}
      {link?.cardCta ? (
        <span className="mt-4 text-sm font-semibold text-[#52B788]">{link.cardCta}</span>
      ) : link ? (
        <span className="mt-4 text-sm font-semibold text-[#52B788]">Learn more</span>
      ) : null}
    </article>
  );

  if (!link) {
    return cardBody;
  }

  if (link.kind === "calendly") {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className="block h-full">
        {cardBody}
      </a>
    );
  }

  return (
    <Link href={link.href} className="block h-full">
      {cardBody}
    </Link>
  );
}

export default function CoachBioPage() {
  const { contact } = coachBioContent;

  return (
    <div className="min-h-screen bg-[#050b16] text-zinc-100">
      <section className="border-b border-[#18243a] bg-[#0A1628]">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-12">
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#52B788]">LCB Training</p>
            <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">{coachBioContent.displayName}</h1>
            <p className="mt-2 text-sm font-medium text-[#52B788] sm:text-base">{coachBioContent.titleLine}</p>
            {coachBioContent.location ? (
              <p className="mt-1 text-sm text-zinc-400">{coachBioContent.location}</p>
            ) : null}
            <p className="mt-3 text-sm italic text-zinc-300 sm:text-base">
              &quot;{coachBioContent.slogan}&quot;
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <CoachOptionalPhoto size={152} roundedClass="rounded-2xl ring-2 ring-[#52B788]/30" priority />
            <a
              href={COACH_BIO_PDF_HREF}
              className="inline-flex items-center justify-center rounded-full border border-[#52B788]/50 px-4 py-2 text-sm font-semibold text-[#52B788] transition hover:border-[#52B788] hover:bg-[#0f1d34]"
              download
            >
              Download PDF
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
        <section>
          <SectionLabel>About</SectionLabel>
          <p className="mt-3 text-lg leading-relaxed text-zinc-200">{coachBioContent.aboutSummary}</p>
          <details className="mt-4 rounded-2xl border border-[#18243a] bg-[#0b1324]/60 px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium text-[#52B788]">Read full bio</summary>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-zinc-400">
              {coachBioContent.aboutParagraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
          </details>
        </section>

        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <section>
            <SectionLabel>Experience</SectionLabel>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              {coachBioContent.experience.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-[#52B788]" aria-hidden="true">
                    -
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <SectionLabel>Accolades</SectionLabel>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              {coachBioContent.accolades.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-[#52B788]" aria-hidden="true">
                    -
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-10 rounded-2xl border-l-4 border-[#52B788] bg-[#0A1628]/80 px-5 py-6 sm:px-6">
          <SectionLabel>My Philosophy</SectionLabel>
          <p className="mt-3 text-base leading-relaxed text-zinc-200">{coachBioContent.philosophySummary}</p>
        </section>

        <section className="mt-12">
          <SectionLabel>What I Offer Teams and Programs</SectionLabel>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {coachBioContent.offerings.map((offering) => (
              <OfferingCard key={offering.title} title={offering.title} summary={offering.summary} />
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-3xl bg-[#0A1628] px-5 py-10 text-center sm:px-8">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">
            Want to bring this to your team or program?
          </h2>
          <a
            href={coachBioCalendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#35db72] sm:w-auto"
          >
            Book a call with Coach Broc
          </a>
          <p className="mt-6 text-sm text-zinc-400">
            <a href={`mailto:${contact.email}`} className="text-[#52B788] hover:text-[#9df3bd]">
              {contact.email}
            </a>
            {" | "}
            <a
              href={contact.websiteUrl}
              className="text-[#52B788] hover:text-[#9df3bd]"
              target="_blank"
              rel="noopener noreferrer"
            >
              {contact.website}
            </a>
            {" | "}
            <span>{contact.instagramHandle}</span>
          </p>
        </section>
      </div>
    </div>
  );
}
