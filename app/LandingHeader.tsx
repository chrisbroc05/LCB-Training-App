import Link from "next/link";
import BrandLogo from "@/app/BrandLogo";
import { getHomepagePlansHref } from "@/lib/homepage-plans-link";

type LandingHeaderProps = {
  isLoggedIn: boolean;
};

const landingOutlineButtonClassName =
  "inline-flex h-10 shrink-0 items-center justify-center rounded-full border-2 border-[#52B788] bg-transparent px-3 text-xs font-semibold text-[#52B788] transition hover:bg-[#52B788]/15 sm:h-11 sm:px-5 sm:text-sm";

const landingPrimaryButtonClassName =
  "inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[#22c55e] px-3 text-xs font-semibold text-[#0A1628] transition hover:bg-[#35db72] sm:h-11 sm:px-5 sm:text-sm";

const landingMobileLoginClassName =
  "shrink-0 text-sm font-semibold text-[#52B788] transition hover:text-[#9df3bd]";

export default function LandingHeader({ isLoggedIn }: LandingHeaderProps) {
  const plansHref = getHomepagePlansHref();

  if (isLoggedIn) {
    return (
      <header className="border-b border-[#18243a] bg-black/95 backdrop-blur">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="flex shrink-0 items-center" aria-label="LCB Training home">
            <div className="relative h-9 w-24 sm:h-10 sm:w-28">
              <BrandLogo className="object-contain" />
            </div>
          </Link>

          <p className="hidden text-center text-base font-bold text-white sm:block sm:text-lg">
            LCB Training
          </p>

          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <Link href={plansHref} className={landingOutlineButtonClassName}>
              Plans
            </Link>
            <Link href="/dashboard" className={landingOutlineButtonClassName}>
              Go to Dashboard
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-[#18243a] bg-black/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:py-4">
        <Link href="/" className="flex min-w-0 shrink-0 items-center" aria-label="LCB Training home">
          <div className="relative h-9 w-[5.5rem] sm:h-10 sm:w-28">
            <BrandLogo className="object-contain object-left" />
          </div>
        </Link>

        <p className="hidden text-center text-base font-bold text-white md:block md:text-lg">
          LCB Training
        </p>

        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          <Link href="/#start-free" className={`hidden md:inline-flex ${landingOutlineButtonClassName}`}>
            Start Free
          </Link>
          <Link href={plansHref} className={`hidden md:inline-flex ${landingOutlineButtonClassName}`}>
            Plans
          </Link>
          <Link href="/auth?mode=login" className={`md:hidden ${landingMobileLoginClassName}`}>
            Log In
          </Link>
          <Link
            href="/auth?mode=login"
            className={`hidden md:inline-flex ${landingOutlineButtonClassName}`}
          >
            Log In
          </Link>
          <Link href="/program" className={landingPrimaryButtonClassName}>
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
