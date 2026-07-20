"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  settingsDangerButtonClass,
  settingsErrorMessageClass,
  settingsSuccessMessageClass,
} from "@/app/settings/settings-styles";

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
        className={settingsDangerButtonClass}
      >
        {isSubmitting ? "Cancelling..." : "Cancel Subscription"}
      </button>
      {error ? <p className={settingsErrorMessageClass}>{error}</p> : null}
      {success ? <p className={settingsSuccessMessageClass}>{success}</p> : null}
    </div>
  );
}
