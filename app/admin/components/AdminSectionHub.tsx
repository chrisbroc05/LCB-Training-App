import Link from "next/link";
import type { AdminSectionHubCard } from "@/lib/admin-section-hub-shared";

export default function AdminSectionHub(props: {
  title: string;
  description: string;
  cards: AdminSectionHubCard[];
}) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">{props.title}</h1>
        <p className="mt-2 text-sm text-zinc-400">{props.description}</p>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2">
        {props.cards.map((card) => (
          <li key={card.href}>
            <Link
              href={card.href}
              className="flex h-full flex-col rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 transition hover:border-[#52B788]/40"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-base font-semibold text-zinc-100">{card.title}</p>
                <span className="shrink-0 rounded-full bg-[#1a253a] px-2.5 py-1 text-xs font-bold text-[#9df3bd]">
                  {card.statValue}
                </span>
              </div>
              <p className="mt-2 flex-1 text-sm text-zinc-400">{card.description}</p>
              <p className="mt-3 text-[10px] uppercase tracking-wide text-zinc-500">{card.statLabel}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
