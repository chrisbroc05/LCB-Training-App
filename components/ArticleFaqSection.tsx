import type { ArticleFaqItem } from "@/lib/articles-shared";

type ArticleFaqSectionProps = {
  items: ArticleFaqItem[];
};

function FaqAnswer({ answer }: { answer: string }) {
  return <p className="mt-2 text-[17px] leading-[1.7] text-zinc-300 sm:text-lg">{answer}</p>;
}

export default function ArticleFaqSection({ items }: ArticleFaqSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-label="FAQ" className="mt-12 max-w-[70ch]">
      <h2 className="scroll-mt-site-header border-b border-[#52B788]/55 pb-2 font-[family-name:var(--font-article-display)] text-[28px] font-bold tracking-wide text-white sm:text-[34px]">
        FAQ
      </h2>

      <div className="mt-6 hidden space-y-8 md:block">
        {items.map((item) => (
          <div key={item.question}>
            <h3 className="scroll-mt-site-header text-[20px] font-semibold text-zinc-100 sm:text-[22px]">
              {item.question}
            </h3>
            <FaqAnswer answer={item.answer} />
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3 md:hidden">
        {items.map((item) => (
          <details
            key={item.question}
            className="group rounded-xl border border-[#18243a] bg-[#0b1324]/50 px-4 py-3"
          >
            <summary className="cursor-pointer list-none text-[17px] font-semibold text-zinc-100 [&::-webkit-details-marker]:hidden">
              <span className="flex items-start justify-between gap-3">
                <span>{item.question}</span>
                <span className="shrink-0 text-sm font-normal text-zinc-500 group-open:hidden">
                  Show
                </span>
                <span className="hidden shrink-0 text-sm font-normal text-zinc-500 group-open:inline">
                  Hide
                </span>
              </span>
            </summary>
            <FaqAnswer answer={item.answer} />
          </details>
        ))}
      </div>
    </section>
  );
}
