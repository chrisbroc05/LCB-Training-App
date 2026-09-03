import type { Metadata } from "next";
import BrandLogo from "@/app/BrandLogo";
import RemoteCheckoutButton from "@/app/components/RemoteCheckoutButton";
import {
  REMOTE_SESSION_DURATION,
  REMOTE_SESSION_PRICE,
  coachCredentialLine,
  remoteSessionExpectations,
} from "@/lib/remote-session-branding";

export const metadata: Metadata = {
  title: "Book a Remote Training Session | LCB Training",
  description:
    "Book a live 60-minute remote training session with Coach Broc for hitting, fielding, or mental game feedback.",
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

export default function RemoteSessionPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 md:py-16">
        <section className="rounded-3xl border border-[#52B788] bg-gradient-to-br from-[#0f1d34] to-[#050b16] p-6 text-center shadow-2xl shadow-black/60 sm:p-8 md:p-10">
          <div className="mx-auto mb-6 flex justify-center">
            <div className="relative h-12 w-32 sm:h-14 sm:w-40">
              <BrandLogo className="object-contain" />
            </div>
          </div>

          <p className="text-sm font-semibold uppercase tracking-wide text-[#52B788]">Coach Broc</p>
          <p className="mx-auto mt-2 max-w-2xl text-xs leading-relaxed text-zinc-400 sm:text-sm">
            {coachCredentialLine}
          </p>

          <h1 className="mx-auto mt-6 max-w-2xl text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
            Book Your Remote Training Session
          </h1>

          <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-[#18243a] bg-[#0A1628]/80 p-5 text-left sm:p-6">
            <h2 className="text-lg font-semibold text-zinc-100 sm:text-xl">What to Expect</h2>
            <ul className="mt-4 space-y-3">
              {remoteSessionExpectations.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5">
                    <CheckIcon />
                  </span>
                  <span className="text-sm leading-relaxed text-zinc-200 sm:text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <p className="flex items-end justify-center gap-2">
              <span className="text-4xl font-bold text-zinc-100">${REMOTE_SESSION_PRICE}</span>
              <span className="pb-1 text-sm text-zinc-400">for {REMOTE_SESSION_DURATION}</span>
            </p>
            <p className="mt-3 text-sm text-zinc-400">Limited spots available each week</p>
          </div>

          <div className="mx-auto mt-8 max-w-sm">
            <RemoteCheckoutButton label="Book Now" />
          </div>
        </section>

        <footer className="mt-10 border-t border-[#18243a] py-8 text-center">
          <p className="text-sm font-semibold text-zinc-200">LCB Training</p>
          <p className="mt-1 text-sm text-zinc-400">Work Hard. Be Memorable.</p>
        </footer>
      </div>
    </div>
  );
}
