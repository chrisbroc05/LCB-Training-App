import Link from "next/link";
import {
  REMOTE_SESSION_PRICE,
  heroOfferCardClassName,
  remoteSessionHighlights,
} from "@/lib/remote-session-branding";
import { playbookHeroPrimaryButtonClassName } from "@/lib/playbook-branding";

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

export default function RemoteSessionHeroCard() {
  return (
    <article className={heroOfferCardClassName}>
      <span className="inline-flex w-fit rounded-full bg-[#52B788] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#0A1628]">
        1-on-1 Coaching
      </span>

      <h2 className="mt-4 text-2xl font-bold text-zinc-100 sm:text-3xl">Book a Remote Session</h2>
      <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
        Work directly with Coach Broc in a live 60-minute video session
      </p>

      <ul className="mt-5 space-y-3">
        {remoteSessionHighlights.map((highlight) => (
          <li key={highlight} className="flex items-start gap-3">
            <span className="mt-0.5">
              <CheckIcon />
            </span>
            <span className="text-sm leading-relaxed text-zinc-200 sm:text-base">{highlight}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <p className="flex items-end gap-2">
          <span className="text-4xl font-bold text-zinc-100">${REMOTE_SESSION_PRICE}</span>
          <span className="pb-1 text-sm text-zinc-400">/ one session</span>
        </p>

        <Link href="/remote" className={`${playbookHeroPrimaryButtonClassName} mt-4`}>
          Book My Session
        </Link>
      </div>
    </article>
  );
}
