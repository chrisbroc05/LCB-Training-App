"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import BrandLogo from "@/app/BrandLogo";
import { getHomepagePlansHref } from "@/lib/homepage-plans-link";

type PublicSiteHeaderProps = {
  isLoggedIn: boolean;
};

const publicHeaderTextLinkClassName =
  "shrink-0 text-sm font-semibold text-[#52B788] transition hover:text-[#9df3bd]";

const publicHeaderPrimaryButtonClassName =
  "inline-flex shrink-0 items-center justify-center rounded-full bg-[#22c55e] px-3 py-2 text-xs font-semibold text-black transition hover:bg-[#35db72] md:px-4 md:py-2.5 md:text-sm";

const mobileMenuLinkClassName =
  "block rounded-xl px-3 py-3 text-base font-semibold text-zinc-100 transition hover:bg-[#122038]";

export default function PublicSiteHeader({ isLoggedIn }: PublicSiteHeaderProps) {
  const plansHref = getHomepagePlansHref();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [isLoggedIn]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="public-site-header relative border-b border-[#18243a] md:bg-black/95 md:backdrop-blur">
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

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-zinc-100 transition hover:bg-[#122038] md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </nav>
      </div>

      {menuOpen ? (
        <div
          id={menuId}
          className="border-t border-[#18243a] bg-[#0A1628] px-3 py-3 md:hidden"
        >
          <nav className="mx-auto flex max-w-6xl flex-col" aria-label="Mobile">
            <Link href={plansHref} className={mobileMenuLinkClassName} onClick={closeMenu}>
              Plans
            </Link>
            <Link href="/program" className={mobileMenuLinkClassName} onClick={closeMenu}>
              Program
            </Link>
            <Link href="/resources" className={mobileMenuLinkClassName} onClick={closeMenu}>
              Resources
            </Link>
            {isLoggedIn ? (
              <Link href="/dashboard" className={mobileMenuLinkClassName} onClick={closeMenu}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth?mode=login"
                  className={mobileMenuLinkClassName}
                  onClick={closeMenu}
                >
                  Log In
                </Link>
                <Link href="/program" className={mobileMenuLinkClassName} onClick={closeMenu}>
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
