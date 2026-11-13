import Link from "next/link";
import HomepageVideoFrame from "@/components/HomepageVideoFrame";
import { FREE_SWING_LANDING_PATH } from "@/lib/free-swing-flow";
import { SAMPLE_COACHING_BREAKDOWN_VIMEO_URL } from "@/lib/sample-coaching-breakdown-video-shared";
import { toVimeoEmbedUrl } from "@/lib/vimeo";

const sampleBreakdownEmbedUrl = toVimeoEmbedUrl(SAMPLE_COACHING_BREAKDOWN_VIMEO_URL);

const freeSwingButtonClassName =
  "inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#35db72] sm:w-auto";

export default function SeeHowICoachSection() {
  return (
    <section className="border-t border-[#18243a] bg-black">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-8 md:grid md:grid-cols-2 md:items-center md:gap-10 lg:gap-14">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">See How I Coach</h2>
            <p className="mt-3 text-base leading-relaxed text-zinc-400 sm:text-lg">
            A real video breakdown I sent a player. Every breakdown is built for that player, no
            matter what part of their game we're developing.
            </p>
            <div className="mt-8 hidden md:flex">
              <Link href={FREE_SWING_LANDING_PATH} className={freeSwingButtonClassName}>
                Get Your Free Swing Breakdown
              </Link>
            </div>
          </div>

          {sampleBreakdownEmbedUrl ? (
            <div className="mx-auto w-[min(100%,420px,calc(80vh*9/16))] md:mx-0 md:justify-self-end">
              <HomepageVideoFrame aspectClassName="aspect-[9/16]" bordered={false}>
                <iframe
                  src={sampleBreakdownEmbedUrl}
                  title="Sample swing breakdown from Coach Broc"
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  allow="fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </HomepageVideoFrame>
            </div>
          ) : (
            <p className="text-center text-sm text-zinc-500 md:col-span-2">
              Video embed is unavailable. Check the Vimeo link configuration.
            </p>
          )}

          <div className="flex justify-center md:hidden">
            <Link href={FREE_SWING_LANDING_PATH} className={freeSwingButtonClassName}>
              Get Your Free Swing Breakdown
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
