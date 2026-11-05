import Link from "next/link";
import BrandLogo from "@/app/BrandLogo";
import { getHomepagePlansHref } from "@/lib/homepage-plans-link";

type PublicSiteHeaderProps = {
  isLoggedIn: boolean;
};

const publicHeaderTextLinkClassName =
  "shrink-0 text-sm font-semibold text-[#52B788] transition hover:text-[#9df3bd]";

const publicHeaderPrimaryButtonClassName =
  "inline-flex shrink-0 items-center justify-center rounded-full bg-[#22c55e] px-3 py-2 text-xs font-semibold text-black transition hover:bg-[#35db72] md:px-4 md:py-2.5 md:text-sm";

export default function PublicSiteHeader({ isLoggedIn }: PublicSiteHeaderProps) {
  const plansHref = getHomepagePlansHref();

  return (
    <header className="public-site-header border-b border-[#18243a] md:bg-black/95 md:backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:px-6 md:h-16 md:gap-4">
        <Link href="/" className="flex min-w-0 shrink-0 items-center" aria-label="LCB Training home">
          <div className="relative h-8 w-[5.25rem] md:h-10 md:w-28">
            <BrandLogo className="object-contain object-left" />
          </div>
        </Link>

        <nav
          className="flex min-w-0 flex-nowrap items-center justify-end gap-2 md:gap-4"
          aria-label="Site"
        >
          {isLoggedIn ? (
            <>
              <Link href={plansHref} className={`hidden md:inline ${publicHeaderTextLinkClassName}`}>
                Plans
              </Link>
              <Link href="/dashboard" className={publicHeaderPrimaryButtonClassName}>
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link href={plansHref} className={`hidden md:inline ${publicHeaderTextLinkClassName}`}>
                Plans
              </Link>
              <Link href="/auth?mode=login" className={publicHeaderTextLinkClassName}>
                Log In
              </Link>
              <Link href="/program" className={publicHeaderPrimaryButtonClassName}>
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
