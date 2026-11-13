import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import HomepageVideoFrame from "@/components/HomepageVideoFrame";
import { authOptions } from "@/lib/auth";
import { getFreeSwingAnalysisResponseMode } from "@/lib/free-swing-analysis-response-server";
import {
  FREE_SWING_AUTH_URL,
  FREE_SWING_FORM_PATH,
} from "@/lib/free-swing-flow";
import {
  FREE_SWING_REPORT_SCREENSHOT_SRC,
  getFreeSwingLandingCopy,
} from "@/lib/free-swing-landing-shared";
import { buildPublicPageMetadata } from "@/lib/public-seo";
import { SAMPLE_COACHING_BREAKDOWN_VIMEO_URL } from "@/lib/sample-coaching-breakdown-video-shared";
import { toVimeoEmbedUrl } from "@/lib/vimeo";

export const dynamic = "force-dynamic";

const sampleBreakdownEmbedUrl = toVimeoEmbedUrl(SAMPLE_COACHING_BREAKDOWN_VIMEO_URL);

export async function generateMetadata(): Promise<Metadata> {
  const mode = await getFreeSwingAnalysisResponseMode();
  const copy = getFreeSwingLandingCopy(mode);
  return buildPublicPageMetadata({
    path: "/free-swing-breakdown",
    title: copy.seoTitle,
    description: copy.seoDescription,
  });
}

export default async function FreeSwingBreakdownPage() {
  const [session, mode] = await Promise.all([
    getServerSession(authOptions),
    getFreeSwingAnalysisResponseMode(),
  ]);
  const copy = getFreeSwingLandingCopy(mode);
  const ctaHref = session?.user ? FREE_SWING_FORM_PATH : FREE_SWING_AUTH_URL;
  const isWritten = copy.mode === "WRITTEN_REPORT";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="rounded-3xl border border-[#18243a] bg-[#0b1324]/90 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#52B788]">
          Free from Coach Broc
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
          {copy.headline}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300">{copy.intro}</p>
        <Link
          href={ctaHref}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#35db72] sm:w-auto"
        >
          {copy.ctaLabel}
        </Link>
      </header>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold text-zinc-100">How it works</h2>
        <ol className="mt-5 space-y-4">
          {copy.steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-[#18243a] bg-[#0b1324]/70 px-5 py-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#52B788]">
                Step {index + 1}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-zinc-100">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold text-zinc-100">{copy.sampleHeading}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{copy.sampleBody}</p>
        {isWritten ? (
          <figure className="mx-auto mt-6 max-w-sm overflow-hidden rounded-[1.75rem] border border-[#2b3650] bg-[#050b16] p-2 shadow-2xl shadow-black/40">
            <Image
              src={FREE_SWING_REPORT_SCREENSHOT_SRC}
              alt="Sample swing report from Coach Broc in the LCB Training app"
              width={750}
              height={1638}
              className="h-auto w-full rounded-[1.35rem] object-cover object-top"
              sizes="(max-width: 640px) 90vw, 380px"
              priority
            />
            <figcaption className="px-2 py-3 text-center text-xs text-zinc-500">
              {copy.sampleCaption}
            </figcaption>
          </figure>
        ) : sampleBreakdownEmbedUrl ? (
          <figure className="mx-auto mt-6 w-[min(100%,420px,calc(80vh*9/16))]">
            <HomepageVideoFrame aspectClassName="aspect-[9/16]" bordered={false}>
              <iframe
                src={sampleBreakdownEmbedUrl}
                title="Sample video swing breakdown from Coach Broc"
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                allow="fullscreen; picture-in-picture"
                allowFullScreen
              />
            </HomepageVideoFrame>
            <figcaption className="px-2 py-3 text-center text-xs text-zinc-500">
              {copy.sampleCaption}
            </figcaption>
          </figure>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">
            Video embed is unavailable. Check the Vimeo link configuration.
          </p>
        )}
      </section>

      <section className="mt-10 rounded-2xl border border-[#18243a] bg-[#0b1324]/70 px-5 py-6">
        <h2 className="text-2xl font-semibold text-zinc-100">Who it is for</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
          Baseball and softball players from youth through college. Parents who want clear next steps
          between lessons. Coaches who want another set of eyes on a player&apos;s swing.
        </p>
      </section>

      <div className="mt-10 text-center">
        <Link
          href={ctaHref}
          className="inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#35db72] sm:w-auto"
        >
          {copy.ctaLabel}
        </Link>
      </div>
    </div>
  );
}
