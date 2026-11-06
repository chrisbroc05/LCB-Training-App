"use client";

import { useState } from "react";
import { adminFetchJson } from "@/lib/admin-fetch-shared";
import { formatOptionalDate } from "@/lib/format-date";
import type { MemberDetail } from "@/app/admin/MemberDetailContent";

type AdminMembershipSubscriptionPanelProps = {
  detail: MemberDetail;
  onMemberUpdated: (member: MemberDetail) => void;
};

export default function AdminMembershipSubscriptionPanel({
  detail,
  onMemberUpdated,
}: AdminMembershipSubscriptionPanelProps) {
  const subscription = detail.membershipSubscription;
  const [refundBusy, setRefundBusy] = useState(false);
  const [refundError, setRefundError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!subscription) {
    return null;
  }

  const annualRefund = subscription.annualRefund;

  const handleRefund = async () => {
    setRefundBusy(true);
    setRefundError("");
    try {
      const res = await adminFetchJson<{ error?: string; member?: MemberDetail }>(
        `/api/admin/members/${detail.id}/refund-annual-membership`,
        { method: "POST" },
        { context: "admin-refund-annual", okUserMessage: "Unable to process refund." },
      );
      if (!res.ok || !res.data.member) {
        setRefundError(res.ok ? "Unable to process refund." : res.userMessage);
        return;
      }
      setConfirmOpen(false);
      onMemberUpdated(res.data.member);
    } catch {
      setRefundError("Unable to process refund right now.");
    } finally {
      setRefundBusy(false);
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-[#2b3650] bg-black/20 p-3 text-sm">
      <p className="font-semibold text-zinc-100">Membership subscription</p>
      <p className="mt-1">
        Level: {subscription.levelLabel} | Status: {subscription.statusLabel}
      </p>
      <p className="mt-1">{subscription.billingLine}</p>
      {subscription.foundingDiscountLine ? (
        <p className="mt-1 text-[#52B788]">{subscription.foundingDiscountLine}</p>
      ) : null}
      {subscription.pendingChangeNotices.map((notice) => (
        <p key={notice} className="mt-1 text-yellow-100">
          {notice}
        </p>
      ))}
      {subscription.showNextBilling ? (
        <p className="mt-1">
          Next billing: {formatOptionalDate(subscription.currentPeriodEnd)}
        </p>
      ) : null}
      {subscription.canceledOnLabel ? (
        <p className="mt-1 text-zinc-400">{subscription.canceledOnLabel}</p>
      ) : null}
      {annualRefund?.refundLines.map((line) => (
        <p key={line} className="mt-1 text-zinc-400">
          {line}
        </p>
      ))}
      {annualRefund?.refundWindowLabel ? (
        <p className={`mt-1 ${annualRefund.canRefund ? "text-[#52B788]" : "text-zinc-400"}`}>
          {annualRefund.refundWindowLabel}
        </p>
      ) : null}
      {detail.stripeCustomerId ? (
        <p className="mt-2">
          <a
            href={`https://dashboard.stripe.com/test/customers/${detail.stripeCustomerId}`}
            target="_blank"
            rel="noreferrer"
            className="text-[#52B788] underline"
          >
            Open in Stripe
          </a>
        </p>
      ) : null}
      {annualRefund?.canRefund ? (
        <div className="mt-3">
          <button
            type="button"
            disabled={refundBusy}
            onClick={() => setConfirmOpen(true)}
            className="rounded-full border border-red-400/60 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            Refund annual payment
          </button>
        </div>
      ) : null}
      {refundError ? <p className="mt-2 text-red-300">{refundError}</p> : null}

      {confirmOpen && annualRefund?.canRefund ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="annual-refund-confirm-title"
        >
          <div className="w-full max-w-md rounded-xl border border-[#2b3650] bg-[#0b1324] p-5 text-zinc-200 shadow-xl">
            <p id="annual-refund-confirm-title" className="text-base font-semibold text-zinc-100">
              Refund annual membership
            </p>
            <p className="mt-3 text-sm leading-relaxed">{annualRefund.confirmMessage}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={refundBusy}
                onClick={() => void handleRefund()}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {refundBusy ? "Refunding..." : "Refund and end membership"}
              </button>
              <button
                type="button"
                disabled={refundBusy}
                onClick={() => setConfirmOpen(false)}
                className="rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-[#1a2332] disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
