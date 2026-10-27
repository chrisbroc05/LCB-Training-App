"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import { formatMembershipLevelLabel } from "@/lib/membership-levels-shared";

type Props = {
  level: MembershipLevelKey;
};

export default function CompleteMembershipCheckoutClient({ level }: Props) {
  const [message, setMessage] = useState("Taking you to secure checkout...");
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let retryTimeoutId: number | null = null;

    const clearRetry = () => {
      if (retryTimeoutId != null) {
        window.clearTimeout(retryTimeoutId);
        retryTimeoutId = null;
      }
    };

    const attempt = async () => {
      const response = await fetch("/api/stripe/checkout/membership-level", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
        code?: string;
      };

      if (cancelled) {
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      if (data.code === "UNDER13_PARENT_LOCK" || response.status === 403) {
        setBlocked(false);
        setMessage(
          data.error ??
            "Waiting for parent confirmation. We will open checkout as soon as your parent approves.",
        );
        clearRetry();
        retryTimeoutId = window.setTimeout(() => {
          void attempt();
        }, 15_000);
        return;
      }

      setBlocked(true);
      setMessage(data.error ?? "Unable to start checkout. You can try again from Upgrade.");
    };

    void attempt();

    return () => {
      cancelled = true;
      clearRetry();
    };
  }, [level]);

  return (
    <section className="w-full rounded-3xl border border-[#18243a] bg-[#0b1324]/90 p-8 text-center">
      <h1 className="text-xl font-semibold text-zinc-100">
        {formatMembershipLevelLabel(level)} checkout
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-zinc-400">{message}</p>
      {blocked ? (
        <Link
          href="/upgrade"
          className="mt-6 inline-flex rounded-full border border-[#52B788] px-5 py-2.5 text-sm font-semibold text-[#52B788]"
        >
          Back to plans
        </Link>
      ) : null}
    </section>
  );
}
