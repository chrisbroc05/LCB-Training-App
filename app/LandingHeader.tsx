import Link from "next/link";
import BrandLogo from "@/app/BrandLogo";

type LandingHeaderProps = {
  isLoggedIn: boolean;
};

const landingOutlineButtonClassName =
  "inline-flex h-10 shrink-0 items-center justify-center rounded-full border-2 border-[#52B788] bg-transparent px-3 text-xs font-semibold text-[#52B788] transition hover:bg-[#52B788]/15 sm:h-11 sm:px-5 sm:text-sm";

const landingPrimaryButtonClassName =
  "inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[#22c55e] px-3 text-xs font-semibold text-[#0A1628] transition hover:bg-[#35db72] sm:h-11 sm:px-5 sm:text-sm";

export default function LandingHeader({ isLoggedIn }: LandingHeaderProps) {
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

        <div className="flex justify-end">
          {isLoggedIn ? (
            <Link href="/dashboard" className={landingOutlineButtonClassName}>
              Go to Dashboard
            </Link>
          ) : (
            <Link href="/auth?tier=basic" className={landingPrimaryButtonClassName}>
              Unlock The Playbook
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
