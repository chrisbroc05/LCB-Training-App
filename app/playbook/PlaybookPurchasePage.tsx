import PlaybookCheckoutSection from "@/app/playbook/PlaybookCheckoutSection";
import { PLAYBOOK_INCLUDED_ITEMS } from "@/lib/auth-flow";
import {
  PLAYBOOK_LANDING_SUBHEADLINE,
  PLAYBOOK_NAME,
  PLAYBOOK_PURCHASE_PRICE_SUBTITLE,
  PLAYBOOK_STANDALONE_DESCRIPTION,
} from "@/lib/playbook-branding";

type PlaybookPurchasePageProps = {
  isLoggedIn: boolean;
  autoStartCheckout: boolean;
};

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 text-[#52B788]"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function PlaybookPurchasePage({
  isLoggedIn,
  autoStartCheckout,
}: PlaybookPurchasePageProps) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-6 sm:p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#52B788]">
          Standalone Purchase
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          {PLAYBOOK_NAME}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
          {PLAYBOOK_STANDALONE_DESCRIPTION}
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
          {PLAYBOOK_LANDING_SUBHEADLINE}
        </p>

        <div className="mt-8 rounded-2xl border border-[#2b3650] bg-black/30 p-6 sm:p-8">
          <p className="text-sm uppercase tracking-wide text-zinc-400">One-time purchase</p>
          <p className="mt-2 text-4xl font-bold text-[#98b144] sm:text-5xl">$59</p>
          <p className="mt-2 text-sm text-zinc-400">{PLAYBOOK_PURCHASE_PRICE_SUBTITLE}</p>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">What you get</h2>
          <ul className="mt-5 space-y-4">
            {PLAYBOOK_INCLUDED_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5">
                  <CheckIcon />
                </span>
                <span className="text-sm leading-relaxed text-zinc-200 sm:text-base">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10">
          <PlaybookCheckoutSection isLoggedIn={isLoggedIn} autoStartCheckout={autoStartCheckout} />
        </div>
      </section>
    </div>
  );
}
