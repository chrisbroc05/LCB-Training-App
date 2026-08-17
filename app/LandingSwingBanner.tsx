"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FREE_SWING_AUTH_URL,
  LANDING_SWING_BANNER_DISMISSED_KEY,
} from "@/lib/free-swing-flow";

type LandingSwingBannerProps = {
  isLoggedIn: boolean;
};

export default function LandingSwingBanner({ isLoggedIn }: LandingSwingBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = window.sessionStorage.getItem(LANDING_SWING_BANNER_DISMISSED_KEY);
    setIsVisible(dismissed !== "1");
  }, []);

  if (!isVisible) {
    return null;
  }

  function dismissBanner() {
    window.sessionStorage.setItem(LANDING_SWING_BANNER_DISMISSED_KEY, "1");
    setIsVisible(false);
  }

  const submitHref = isLoggedIn ? "/coaching-submissions" : FREE_SWING_AUTH_URL;

  return (
    <div className="bg-[#2D6A4F] text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="hidden text-sm leading-relaxed sm:block">
            Ready to submit your swing? Get started free and Coach Broc will personally review it
            within 48 hours.
          </p>
          <p className="text-sm leading-relaxed sm:hidden">
            Get your free swing analysis from Coach Broc.
          </p>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <Link
              href={submitHref}
              className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#2D6A4F] transition hover:bg-zinc-100"
            >
              Submit My Swing
            </Link>
            <button
              type="button"
              onClick={dismissBanner}
              aria-label="Dismiss banner"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg leading-none text-white transition hover:bg-white/15"
            >
              X
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
