"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PlanChangeConfirmModal from "@/app/settings/PlanChangeConfirmModal";
import { postCheckout } from "@/lib/checkout-client";
import type { PlanChangeModalContent } from "@/lib/membership-change-shared";
import {
  PLAYBOOK_CORE_ONE_TIME_BUTTON_LABEL,
  PLAYBOOK_CORE_PLUS_UPSELL_DESCRIPTION,
  PLAYBOOK_CORE_PLUS_UPSELL_TITLE,
} from "@/lib/playbook-core-upsell-shared";
import {
  playbookPrimaryButtonClassName,
  playbookSecondaryButtonClassName,
} from "@/lib/playbook-branding";

const MY_PLAN_SUCCESS_STORAGE_KEY = "lcb.myPlanSuccessMessage";

type PlaybookCoreMemberUnlockActionsProps = {
  layout?: "stacked" | "card";
  afterPlusUpgradeRedirect?: string;
};

export default function PlaybookCoreMemberUnlockActions({
  layout = "stacked",
  afterPlusUpgradeRedirect = "/playbook",
}: PlaybookCoreMemberUnlockActionsProps) {
  const router = useRouter();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<PlanChangeModalContent | null>(null);
  const [busy, setBusy] = useState(false);
  const [plusError, setPlusError] = useState("");

  const startOneTimeCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const payload = await postCheckout("/api/stripe/checkout/basic");
      window.location.href = payload.url!;
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "Unable to start checkout.",
      );
      setCheckoutLoading(false);
    }
  };

  const openPlusUpgradeModal = async () => {
    setPreviewLoading(true);
    setPlusError("");
    const response = await fetch(
      "/api/stripe/subscription/plan-change-preview?action=upgrade&level=plus",
    );
    const data = (await response.json().catch(() => ({}))) as PlanChangeModalContent & {
      error?: string;
    };
    setPreviewLoading(false);
    if (!response.ok) {
      setPlusError(data.error ?? "Could not load upgrade details.");
      return;
    }
    setModalContent(data);
    setModalOpen(true);
  };

  const confirmPlusUpgrade = async () => {
    if (!modalContent) {
      return;
    }
    setBusy(true);
    setPlusError("");
    const response = await fetch("/api/stripe/subscription/change-level", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level: "PLUS", action: "upgrade" }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      successMessage?: string;
    };
    setBusy(false);
    if (!response.ok) {
      setPlusError(data.error ?? "Could not upgrade plan.");
      return;
    }
    sessionStorage.setItem(
      MY_PLAN_SUCCESS_STORAGE_KEY,
      data.successMessage ?? modalContent.successMessage,
    );
    setModalOpen(false);
    setModalContent(null);
    router.push(afterPlusUpgradeRedirect);
    router.refresh();
  };

  const primaryClass =
    layout === "card"
      ? "inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-70"
      : playbookPrimaryButtonClassName;
  const secondaryClass =
    layout === "card"
      ? "inline-flex w-full items-center justify-center rounded-full border border-[#52B788] px-5 py-2.5 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/10 disabled:cursor-not-allowed disabled:opacity-70"
      : playbookSecondaryButtonClassName;

  return (
    <>
      <div className={layout === "stacked" ? "space-y-4" : "mt-4 space-y-3"}>
        <div className="rounded-xl border border-[#2b3650] bg-black/20 p-4">
          <button
            type="button"
            onClick={() => void openPlusUpgradeModal()}
            disabled={previewLoading || busy}
            className={`${primaryClass} w-full`}
          >
            {previewLoading ? "Loading..." : PLAYBOOK_CORE_PLUS_UPSELL_TITLE}
          </button>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            {PLAYBOOK_CORE_PLUS_UPSELL_DESCRIPTION}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void startOneTimeCheckout()}
          disabled={checkoutLoading || busy}
          className={secondaryClass}
        >
          {checkoutLoading ? "Redirecting to checkout..." : PLAYBOOK_CORE_ONE_TIME_BUTTON_LABEL}
        </button>
        {checkoutError ? <p className="text-sm text-red-300">{checkoutError}</p> : null}
        {plusError ? <p className="text-sm text-red-300">{plusError}</p> : null}
      </div>
      <PlanChangeConfirmModal
        open={modalOpen}
        content={modalContent}
        busy={busy}
        onClose={() => {
          if (!busy) {
            setModalOpen(false);
            setModalContent(null);
          }
        }}
        onConfirm={() => void confirmPlusUpgrade()}
      />
    </>
  );
}
