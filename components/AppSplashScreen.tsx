"use client";

import { useEffect, useState } from "react";
import { BRAND_PRIMARY_SLOGAN } from "@/lib/brand-copy";

type SplashPhase = "visible" | "fading" | "hidden";

export default function AppSplashScreen() {
  const [phase, setPhase] = useState<SplashPhase>("visible");
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setPhase("fading"), 550);
    const hideTimer = window.setTimeout(() => setPhase("hidden"), 950);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (phase === "hidden") {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A1628] transition-opacity duration-[400ms] ease-out ${
        phase === "fading" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="splash-content flex flex-col items-center px-8 text-center">
        {logoFailed ? (
          <p className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            LCB <span className="text-[#52B788]">Training</span>
          </p>
        ) : (
          <img
            src="/logo/lcb-training-logo.png"
            alt="LCB Training"
            className="splash-logo-pulse h-20 w-auto max-w-[220px] object-contain"
            onError={() => setLogoFailed(true)}
          />
        )}

        <p className="mt-5 text-base font-medium text-white/90 sm:text-lg">
          {BRAND_PRIMARY_SLOGAN}
        </p>

        <div className="mt-8 flex items-center gap-2" aria-hidden="true">
          <span className="splash-dot h-1.5 w-1.5 rounded-full bg-[#52B788]" />
          <span className="splash-dot splash-dot-delay-1 h-1.5 w-1.5 rounded-full bg-[#52B788]" />
          <span className="splash-dot splash-dot-delay-2 h-1.5 w-1.5 rounded-full bg-[#52B788]" />
        </div>
      </div>
    </div>
  );
}
