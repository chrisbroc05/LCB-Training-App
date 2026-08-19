import Link from "next/link";
import BrandLogo from "@/app/BrandLogo";
import PlaybookPurchaseCta from "@/app/components/PlaybookPurchaseCta";

type LandingHeaderProps = {
  isLoggedIn: boolean;
};

const landingNavButtonClassName =
  "inline-flex h-10 items-center justify-center rounded-full border-2 border-[#52B788] bg-transparent px-4 text-xs font-semibold text-[#52B788] transition hover:bg-[#52B788]/15 sm:h-11 sm:px-5 sm:text-sm";

export default function LandingHeader({ isLoggedIn }: LandingHeaderProps) {
  return (
    <header className="border-b border-[#18243a] bg-black/95 backdrop-blur">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div aria-hidden="true" />
        <Link
          href="/"
          className="flex min-w-0 items-center justify-center gap-2 sm:gap-3"
        >
          <div className="relative h-9 w-24 shrink-0 sm:h-10 sm:w-28">
            <BrandLogo className="object-contain" />
          </div>
          <span className="truncate text-base font-semibold tracking-tight text-zinc-100 sm:text-lg">
            LCB <span className="text-[#22c55e]">Training</span>
          </span>
        </Link>
        <div className="flex justify-end">
          {isLoggedIn ? (
            <Link href="/dashboard" className={landingNavButtonClassName}>
              Go to Dashboard
            </Link>
          ) : (
            <PlaybookPurchaseCta
              showSubtitle={false}
              buttonClassName={landingNavButtonClassName}
            />
          )}
        </div>
      </div>
    </header>
  );
}
