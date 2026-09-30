import type { LegalDocumentConfig } from "@/lib/legal-shared";

type LegalDocumentViewProps = {
  document: LegalDocumentConfig;
};

export default function LegalDocumentView({ document }: LegalDocumentViewProps) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">{document.title}</h1>
        <p className="mt-3 text-sm text-zinc-400">Last updated: {document.lastUpdatedLabel}</p>
        {document.intro ? <p className="mt-4 text-zinc-300">{document.intro}</p> : null}
      </section>

      <section className="mt-8 space-y-5">
        {document.blocks.map((block, index) => {
          if (block.type === "heading") {
            return (
              <article
                key={`${block.text}-${index}`}
                className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6"
              >
                <h2 className="text-xl font-semibold text-zinc-100">{block.text}</h2>
              </article>
            );
          }

          if (block.type === "paragraph") {
            return (
              <article
                key={`${block.text.slice(0, 24)}-${index}`}
                className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6"
              >
                <p className="text-zinc-300">{block.text}</p>
              </article>
            );
          }

          return (
            <article
              key={`bullets-${index}`}
              className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6"
            >
              <ul className="list-disc space-y-2 pl-5 text-zinc-300">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>
    </div>
  );
}
