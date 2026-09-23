"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type TwelveWeekProgramCheckoutButtonProps = {
  isLoggedIn: boolean;
  buttonClassName?: string;
  label?: string;
  autoStartCheckout?: boolean;
};

const defaultButtonClassName =
  "inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#35db72] sm:w-auto";

export default function TwelveWeekProgramCheckoutButton({
  isLoggedIn,
  buttonClassName = defaultButtonClassName,
  label = "Enroll in the Twelve Week Program",
  autoStartCheckout = false,
}: TwelveWeekProgramCheckoutButtonProps) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startCheckout = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/checkout/twelve-week", {
        method: "POST",
      });

      const payload = (await response.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Unable to start checkout.");
      }

      window.location.href = payload.url;
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout.",
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoStartCheckout || !isLoggedIn || loading) {
      return;
    }

    void startCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartCheckout, isLoggedIn]);

  if (!isLoggedIn) {
    const redirectPath = autoStartCheckout ? "/program?startCheckout=1" : "/program";
    return (
      <Link href={`/auth?mode=signup&redirect=${encodeURIComponent(redirectPath)}`} className={buttonClassName}>
        {label}
      </Link>
    );
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={() => void startCheckout()} disabled={loading} className={buttonClassName}>
        {loading ? "Redirecting to checkout..." : label}
      </button>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {searchParams.get("checkout") === "cancelled" ? (
        <p className="text-sm text-zinc-400">Checkout was cancelled. You can try again whenever you are ready.</p>
      ) : null}
    </div>
  );
}
