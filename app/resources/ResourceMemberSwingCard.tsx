import Link from "next/link";
import type { ResourceHubMemberSwingCard } from "@/lib/resources-hub-member-shared";

type Props = {
  card: ResourceHubMemberSwingCard;
};

export default function ResourceMemberSwingCard({ card }: Props) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#52B788]/40 bg-[#0d1c31] p-5 shadow-lg shadow-black/20">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#52B788]/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-[#52B788]">
          Included
        </span>
        <span className="rounded-full border border-zinc-400/50 bg-transparent px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-200">
          START HERE
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold leading-snug text-white">{card.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-300">{card.description}</p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#52B788]">
        {card.includedLabel}
      </p>
      <Link
        href={card.href}
        className="mt-5 flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#2D6A4F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#52B788] hover:text-[#0A1628]"
      >
        {card.buttonLabel}
      </Link>
    </article>
  );
}
