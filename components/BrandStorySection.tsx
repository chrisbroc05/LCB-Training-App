import { BRAND_SECONDARY_TAGLINE } from "@/lib/brand-copy";

export default function BrandStorySection() {
  return (
    <section className="border-t border-[#52B788]/20 bg-[#0A1628]">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="space-y-5 text-center text-base leading-relaxed text-zinc-300 sm:text-lg">
          <p>
            Great players are remembered for more than their stats. They are remembered for hustling
            down the line on a routine ground ball. For asking good questions. For looking a coach in
            the eye when it matters.
          </p>
          <p>
            LCB Training builds the complete player -- hitting, fielding, speed and agility, strength
            and mobility. But all of it serves the same underlying question:{" "}
            <span className="font-semibold text-[#52B788]">{BRAND_SECONDARY_TAGLINE}</span>
          </p>
          <p>
            The physical training and the mindset coaching are not two separate offerings. They are
            one philosophy. We work the mechanics, the movement, and the mental game together because
            effort and identity show up in every rep -- not just on the stat sheet.
          </p>
        </div>
      </div>
    </section>
  );
}
