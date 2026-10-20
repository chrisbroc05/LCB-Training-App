import type { Metadata } from "next";
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

function OfferingCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const link = getCoachOfferingLink(title);
  const cardBody = (
    <article className="flex h-full flex-col rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 shadow-lg shadow-black/30 transition hover:border-[#52B788]/40">
      <div className="h-1 w-10 rounded-full bg-[#52B788]" />
      <h3 className="mt-4 text-lg font-semibold text-zinc-100">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-300">{description}</p>
      {link?.cardCta ? (
        <span className="mt-4 inline-flex text-sm font-semibold text-[#52B788]">{link.cardCta}</span>
      ) : link ? (
        <span className="mt-4 inline-flex text-sm font-semibold text-[#52B788]">Learn more</span>
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
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="order-2 flex-1 text-center sm:order-1 sm:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#52B788]">LCB Training</p>
            <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">{coachBioContent.displayName}</h1>
            <p className="mt-2 text-base font-semibold text-[#52B788]">{coachBioContent.titleLine}</p>
            <p className="mt-1 text-sm text-zinc-400">{coachBioContent.location}</p>
            <p className="mt-3 text-base italic text-zinc-200">&quot;{coachBioContent.slogan}&quot;</p>
            <a
              href={COACH_BIO_PDF_HREF}
              className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-[#52B788]/50 bg-[#0A1628] px-4 py-2.5 text-sm font-semibold text-[#52B788] transition hover:border-[#52B788] hover:bg-[#0f1d34] sm:hidden"
              download
            >
              Download PDF
            </a>
          </div>
          <div className="order-1 flex shrink-0 flex-col items-center gap-3 sm:order-2 sm:items-end">
            <CoachOptionalPhoto size={168} roundedClass="rounded-2xl" priority />
            <a
              href={COACH_BIO_PDF_HREF}
              className="hidden items-center justify-center rounded-full border border-[#52B788]/50 bg-[#0A1628] px-4 py-2.5 text-sm font-semibold text-[#52B788] transition hover:border-[#52B788] hover:bg-[#0f1d34] sm:inline-flex"
              download
            >
              Download PDF
            </a>
          </div>
        </div>

        <section className="mt-10 rounded-3xl border border-[#18243a] bg-[#0A1628] px-5 py-8 sm:px-8">
          <h2 className="text-xl font-semibold text-white">About</h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-zinc-300">
            {coachBioContent.aboutParagraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 px-5 py-7 sm:px-6">
            <h2 className="text-lg font-semibold text-white">Accolades</h2>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              {coachBioContent.accolades.map((item) => (
                <li key={item} className="border-l-2 border-[#52B788] pl-3">
                  {item}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 px-5 py-7 sm:px-6">
            <h2 className="text-lg font-semibold text-white">Experience</h2>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              {coachBioContent.experience.map((item) => (
                <li key={item} className="border-l-2 border-[#52B788] pl-3">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-8 rounded-3xl border border-[#52B788]/30 bg-gradient-to-br from-[#0f1d34] to-[#050b16] px-5 py-8 sm:px-8">
          <h2 className="text-xl font-semibold text-white">My Philosophy</h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-300">{coachBioContent.philosophy}</p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-white">What I Offer Teams and Programs</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {coachBioContent.offerings.map((offering) => (
              <OfferingCard key={offering.title} title={offering.title} description={offering.description} />
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-[#18243a] bg-[#0A1628] px-5 py-10 text-center sm:px-8">
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
