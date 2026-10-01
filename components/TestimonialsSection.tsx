import { TESTIMONIALS } from "@/lib/testimonials";

type TestimonialsSectionProps = {
  className?: string;
};

function TestimonialCard({ quote, attribution }: { quote: string; attribution: string }) {
  return (
    <article className="flex h-full min-w-[85%] flex-col rounded-2xl border border-[#1f2e4b] bg-[#111f37] p-6 shadow-lg shadow-black/30 snap-center sm:min-w-[70%] md:min-w-0">
      <p className="text-5xl font-bold leading-none text-[#52B788]">&ldquo;</p>
      <p className="mt-3 flex-1 text-[15px] italic leading-relaxed text-zinc-100 sm:text-base">
        {quote}
      </p>
      <p className="mt-6 text-sm font-medium text-[#52B788]">- {attribution}</p>
    </article>
  );
}

export default function TestimonialsSection({ className = "" }: TestimonialsSectionProps) {
  return (
    <section
      className={`rounded-3xl bg-[#0A1628] px-5 py-14 sm:px-8 sm:py-16 md:px-12 md:py-20 ${className}`}
    >
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-2xl font-bold text-zinc-100 sm:text-3xl">
          What Players &amp; Parents Are Saying
        </h2>
        <div className="mx-auto mt-4 h-[2px] w-28 rounded-full bg-[#52B788]" />
      </div>

      <div className="mt-10 md:hidden">
        <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TESTIMONIALS.map((testimonial) => (
            <TestimonialCard
              key={testimonial.attribution}
              quote={testimonial.quote}
              attribution={testimonial.attribution}
            />
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-zinc-500">Swipe to read more</p>
      </div>

      <div className="mt-10 hidden gap-5 md:grid md:grid-cols-2">
        {TESTIMONIALS.map((testimonial, index) => (
          <div
            key={testimonial.attribution}
            className={index === TESTIMONIALS.length - 1 ? "md:col-span-2 md:mx-auto md:max-w-xl md:w-full" : ""}
          >
            <TestimonialCard quote={testimonial.quote} attribution={testimonial.attribution} />
          </div>
        ))}
      </div>
    </section>
  );
}
