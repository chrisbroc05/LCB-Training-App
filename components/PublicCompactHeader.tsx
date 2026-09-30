"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BrandLogo from "@/app/BrandLogo";

type PublicCompactHeaderProps = {
  isLoggedIn?: boolean;
};

export default function PublicCompactHeader({ isLoggedIn: isLoggedInProp }: PublicCompactHeaderProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(isLoggedInProp ?? false);

  useEffect(() => {
    if (isLoggedInProp !== undefined) {
      setIsLoggedIn(isLoggedInProp);
      return;
    }

    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((session) => setIsLoggedIn(Boolean(session?.user)))
      .catch(() => {});
  }, [isLoggedInProp]);

  const handleBack = () => {
    const fallback = isLoggedIn ? "/dashboard" : "/";

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallback);
  };

  return (
    <header
      className="sticky top-0 z-40 bg-[#0A1628]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-12 max-w-[760px] items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="relative block h-9 w-[110px] shrink-0" aria-label="LCB Training home">
          <BrandLogo className="object-contain object-left" />
        </Link>
        <button
          type="button"
          onClick={handleBack}
          className="text-sm font-medium text-zinc-300 transition hover:text-white"
        >
          Back
        </button>
      </div>
    </header>
  );
}
