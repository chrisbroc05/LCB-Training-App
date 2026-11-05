import Link from "next/link";
import { HOMEPAGE_FAQ_ITEMS } from "@/lib/homepage-faq-shared";

export default function HomepageFaqSection() {
  return (
    <section className="mt-14 border-t border-[#18243a] pt-12">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-2xl font-semibold text-zinc-100 sm:text-3xl">
          Common questions
        </h2>
        <p className="mt-3 text-center text-sm text-zinc-400 sm:text-base">
          Straight answers before you commit to anything.
        </p>
        <ul className="mt-8 space-y-3">
          {HOMEPAGE_FAQ_ITEMS.map((item) => (
            <li key={item.question}>
              <details className="group rounded-2xl border border-[#18243a] bg-[#0b1324]/80 open:border-[#52B788]/30">
                <summary className="cursor-pointer list-none px-5 py-4 text-base font-semibold text-zinc-100 marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-3">
                    {item.question}
                    <span
                      className="mt-0.5 shrink-0 text-[#52B788] transition group-open:rotate-45"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </span>
                </summary>
                <p className="border-t border-[#18243a] px-5 pb-4 pt-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
                  {item.answer}
                </p>
              </details>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-sm text-zinc-500">
          Ready to try it?{" "}
          <Link href="/#start-free" className="font-semibold text-[#52B788] hover:text-[#9df3bd]">
            Start free
          </Link>
          {" or "}
          <Link href="/program" className="font-semibold text-[#52B788] hover:text-[#9df3bd]">
            see the 12-Week Program
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
