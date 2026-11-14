import type { ArticleTocItem } from "@/lib/articles-shared";

type ArticleTableOfContentsProps = {
  items: ArticleTocItem[];
};

function TocList({ items }: { items: ArticleTocItem[] }) {
  return (
    <ol className="mt-3 list-decimal space-y-2 pl-5 marker:text-[#52B788]">
      {items.map((item) => (
        <li key={item.id} className="pl-1">
          <a
            href={`#${item.id}`}
            className="text-sm font-medium text-[#52B788] no-underline hover:underline hover:decoration-[#52B788]/70 hover:underline-offset-2 sm:text-[15px]"
          >
            {item.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

export default function ArticleTableOfContents({ items }: ArticleTableOfContentsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Table of contents"
      className="mt-6 rounded-2xl border border-[#18243a] bg-[#0b1324] px-4 py-4 sm:px-5"
    >
      <div className="hidden md:block">
        <p className="font-[family-name:var(--font-article-display)] text-lg font-bold tracking-wide text-white">
          Table of contents
        </p>
        <TocList items={items} />
      </div>

      <details className="group md:hidden">
        <summary className="cursor-pointer list-none font-[family-name:var(--font-article-display)] text-lg font-bold tracking-wide text-white [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-3">
            Table of contents
            <span className="text-sm font-normal text-zinc-500 group-open:hidden">Show</span>
            <span className="hidden text-sm font-normal text-zinc-500 group-open:inline">Hide</span>
          </span>
        </summary>
        <TocList items={items} />
      </details>
    </nav>
  );
}
