import type { LegalDocumentConfig } from "@/lib/legal-shared";

type LegalDocumentViewProps = {
  document: LegalDocumentConfig;
};

export default function LegalDocumentView({ document }: LegalDocumentViewProps) {
  return (
    <article className="mx-auto w-full max-w-[760px] px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">{document.title}</h1>
      <p className="mt-2 text-sm text-zinc-400">Last updated: {document.lastUpdatedLabel}</p>
      {document.intro ? (
        <p className="mt-4 leading-relaxed text-zinc-300">{document.intro}</p>
      ) : null}

      <div className="mt-8 space-y-6 text-zinc-300">
        {document.blocks.map((block, index) => {
          if (block.type === "heading") {
            return (
              <h2 key={`${block.text}-${index}`} className="text-xl font-semibold text-zinc-100">
                {block.text}
              </h2>
            );
          }

          if (block.type === "paragraph") {
            return (
              <p key={`${block.text.slice(0, 24)}-${index}`} className="leading-relaxed">
                {block.text}
              </p>
            );
          }

          return (
            <ul key={`bullets-${index}`} className="list-disc space-y-2 pl-5 leading-relaxed">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        })}
      </div>
    </article>
  );
}
