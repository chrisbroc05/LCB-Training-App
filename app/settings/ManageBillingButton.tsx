"use client";

import { useState } from "react";
import { settingsErrorMessageClass, settingsSecondaryButtonClass } from "@/app/settings/settings-styles";

export default function ManageBillingButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleClick = async () => {
    setIsLoading(true);
    setErrorMessage("");

    const response = await fetch("/api/stripe/billing-portal", {
      method: "POST",
    });

    setIsLoading(false);

    const data = (await response.json().catch(() => ({}))) as { error?: string; url?: string };

    if (!response.ok || !data.url) {
      setErrorMessage(data.error ?? "Unable to open billing portal right now.");
      return;
    }

    window.location.href = data.url;
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={isLoading}
        className={settingsSecondaryButtonClass}
      >
        {isLoading ? "Opening..." : "Manage Billing"}
      </button>
      {errorMessage ? <p className={`mt-3 ${settingsErrorMessageClass}`}>{errorMessage}</p> : null}
    </div>
  );
}
