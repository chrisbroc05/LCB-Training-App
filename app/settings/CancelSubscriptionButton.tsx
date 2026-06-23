"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CancelSubscriptionButtonProps = {
  disabled?: boolean;
};

export default function CancelSubscriptionButton({ disabled = false }: CancelSubscriptionButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleCancel() {
    const shouldContinue = window.confirm(
      "Cancel your subscription at the end of the current billing period?",
    );
    if (!shouldContinue) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/stripe/subscription/cancel", {
        method: "POST",
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        currentPeriodEnd?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Unable to cancel subscription.");
        return;
      }

      setSuccess("Subscription cancellation scheduled. Access remains active until period end.");
      router.refresh();
    } catch {
      setError("Unable to cancel subscription right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleCancel}
        disabled={disabled || isSubmitting}
        className="w-full rounded-full border border-red-500/70 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isSubmitting ? "Cancelling..." : "Cancel Subscription"}
      </button>
      {error && <p className="text-sm text-red-300">{error}</p>}
      {success && <p className="text-sm text-[#9df3bd]">{success}</p>}
    </div>
  );
}
