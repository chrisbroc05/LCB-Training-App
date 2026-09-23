"use client";

import { useState } from "react";
import { playbookHeroPrimaryButtonClassName } from "@/lib/playbook-branding";

type RemoteCheckoutButtonProps = {
  label?: string;
  className?: string;
};

export default function RemoteCheckoutButton({
  label = "Book Now",
  className = playbookHeroPrimaryButtonClassName,
}: RemoteCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleCheckout() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/checkout/remote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Unable to start checkout.");
      }

      window.location.href = payload.url;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to start checkout.");
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isLoading}
        className={`${className} disabled:cursor-not-allowed disabled:opacity-70`}
      >
        {isLoading ? "Redirecting..." : label}
      </button>
      {errorMessage ? <p className="mt-3 text-sm text-red-400">{errorMessage}</p> : null}
    </div>
  );
}
