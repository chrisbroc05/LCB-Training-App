type ArticleKeyTakeawaysProps = {
  items: string[];
};

export default function ArticleKeyTakeaways({ items }: ArticleKeyTakeawaysProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <aside
      aria-label="Key takeaways"
      className="mt-8 rounded-2xl border border-[#18243a] border-l-4 border-l-[#52B788] bg-[#0b1324] px-5 py-5 sm:px-6"
    >
      <p className="font-[family-name:var(--font-article-display)] text-lg font-bold tracking-wide text-white sm:text-xl">
        Key takeaways
      </p>
      <ul className="mt-4 list-disc space-y-3 pl-5 marker:text-[#52B788]">
        {items.map((item) => (
          <li key={item.slice(0, 48)} className="pl-1 text-[17px] leading-[1.7] text-zinc-200">
            {item}
          </li>
        ))}
      </ul>
    </aside>
  );
}
