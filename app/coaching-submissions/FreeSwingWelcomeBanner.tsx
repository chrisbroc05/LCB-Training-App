"use client";

import { useEffect, useState } from "react";
import {
  COACHING_WELCOME_SEEN_KEY,
  PENDING_COACHING_WELCOME_KEY,
} from "@/lib/free-swing-flow";

export default function FreeSwingWelcomeBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const seen = window.localStorage.getItem(COACHING_WELCOME_SEEN_KEY);
    const pending = window.localStorage.getItem(PENDING_COACHING_WELCOME_KEY);

    if (seen !== "1" && pending === "1") {
      setIsVisible(true);
      window.localStorage.setItem(COACHING_WELCOME_SEEN_KEY, "1");
      window.localStorage.removeItem(PENDING_COACHING_WELCOME_KEY);
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <section className="mb-6 rounded-xl border border-[#22c55e]/40 bg-[#22c55e]/10 px-4 py-4 sm:px-5">
      <p className="text-sm leading-relaxed text-[#9df3bd] sm:text-base">
        Welcome to LCB Training! You are one step away -- upload your swing video below and Coach
        Broc will personally review it and get back to you within 48 hours.
      </p>
    </section>
  );
}
