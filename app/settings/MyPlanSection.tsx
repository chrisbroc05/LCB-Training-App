"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SettingsCard from "@/app/settings/SettingsCard";
import PlanChangeConfirmModal from "@/app/settings/PlanChangeConfirmModal";
import ManageBillingButton from "@/app/settings/ManageBillingButton";
import {
  settingsAccentTextClass,
  settingsBodyTextClass,
  settingsMutedTextClass,
  settingsSecondaryButtonClass,
  settingsSuccessMessageClass,
  settingsWarningTextClass,
} from "@/app/settings/settings-styles";
import type { PlanChangeModalContent } from "@/lib/membership-change-shared";
import { buildPendingCancelNotice, buildPendingDowngradeNotice } from "@/lib/membership-change-shared";
import {
  formatMembershipLevelLabel,
  MEMBERSHIP_LEVELS,
  type MembershipLevelKey,
} from "@/lib/membership-levels-shared";

const MY_PLAN_SUCCESS_STORAGE_KEY = "lcb.myPlanSuccessMessage";

type MyPlanSectionProps = {
  level: MembershipLevelKey;
  status: string;
  statusLabel: string;
  nextBillingLabel: string;
  cancelAtPeriodEnd: boolean;
  pendingLevel: MembershipLevelKey | null;
  pendingLevelEffectiveLabel: string | null;
};

const LEVEL_ORDER: MembershipLevelKey[] = ["CORE", "PLUS", "ALL_ACCESS"];

type PendingModalAction =
  | { type: "change"; target: MembershipLevelKey; action: "upgrade" | "downgrade" }
  | { type: "cancel" };

export default function MyPlanSection({
  level,
  status,
  statusLabel,
  nextBillingLabel,
  cancelAtPeriodEnd,
  pendingLevel,
  pendingLevelEffectiveLabel,
}: MyPlanSectionProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [modalContent, setModalContent] = useState<PlanChangeModalContent | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingModalAction | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(MY_PLAN_SUCCESS_STORAGE_KEY);
    if (stored) {
      setSuccessMessage(stored);
      sessionStorage.removeItem(MY_PLAN_SUCCESS_STORAGE_KEY);
    }
  }, []);

  const persistSuccessAndRefresh = (message: string) => {
    sessionStorage.setItem(MY_PLAN_SUCCESS_STORAGE_KEY, message);
    setModalOpen(false);
    setModalContent(null);
    setPendingAction(null);
    router.refresh();
  };

  const fetchPreview = async (
    action: "upgrade" | "downgrade" | "cancel",
    targetLevel?: MembershipLevelKey,
  ): Promise<PlanChangeModalContent | null> => {
    const params = new URLSearchParams({ action });
    if (targetLevel) {
      params.set("level", targetLevel.toLowerCase());
    }
    const response = await fetch(`/api/stripe/subscription/plan-change-preview?${params.toString()}`);
    const data = (await response.json().catch(() => ({}))) as PlanChangeModalContent & {
      error?: string;
    };
    if (!response.ok) {
      setErrorMessage(data.error ?? "Could not load plan details.");
      return null;
    }
    return data;
  };

  const openChangeModal = async (target: MembershipLevelKey, action: "upgrade" | "downgrade") => {
    setPreviewLoading(true);
    setErrorMessage("");
    const preview = await fetchPreview(action, target);
    setPreviewLoading(false);
    if (!preview) {
      return;
    }
    setModalContent(preview);
    setPendingAction({ type: "change", target, action });
    setModalOpen(true);
  };

  const openCancelModal = async () => {
    setPreviewLoading(true);
    setErrorMessage("");
    const preview = await fetchPreview("cancel");
    setPreviewLoading(false);
    if (!preview) {
      return;
    }
    setModalContent(preview);
    setPendingAction({ type: "cancel" });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (busy) {
      return;
    }
    setModalOpen(false);
    setModalContent(null);
    setPendingAction(null);
  };

  const confirmModal = async () => {
    if (!pendingAction || !modalContent) {
      return;
    }

    setBusy(true);
    setErrorMessage("");

    if (pendingAction.type === "cancel") {
      const response = await fetch("/api/stripe/subscription/cancel-membership", { method: "POST" });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        successMessage?: string;
      };
      setBusy(false);
      if (!response.ok) {
        setErrorMessage(data.error ?? "Could not cancel.");
        return;
      }
      persistSuccessAndRefresh(data.successMessage ?? modalContent.successMessage);
      return;
    }

    const response = await fetch("/api/stripe/subscription/change-level", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level: pendingAction.target, action: pendingAction.action }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      successMessage?: string;
    };
    setBusy(false);
    if (!response.ok) {
      setErrorMessage(data.error ?? "Could not update plan.");
      return;
    }
    persistSuccessAndRefresh(data.successMessage ?? modalContent.successMessage);
  };

  const keepCurrentPlan = async (intent: "pending_downgrade" | "scheduled_cancel") => {
    setBusy(true);
    setErrorMessage("");
    const response = await fetch("/api/stripe/subscription/keep-current-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      successMessage?: string;
    };
    setBusy(false);
    if (!response.ok) {
      setErrorMessage(data.error ?? "Could not update plan.");
      return;
    }
    persistSuccessAndRefresh(data.successMessage ?? "Your plan was updated.");
  };

  const pendingDowngradeNotice =
    pendingLevel && pendingLevelEffectiveLabel && !cancelAtPeriodEnd
      ? buildPendingDowngradeNotice({
          currentLevel: level,
          targetLevel: pendingLevel,
          effectiveDateLabel: pendingLevelEffectiveLabel,
        })
      : null;

  const pendingCancelNotice = cancelAtPeriodEnd
    ? buildPendingCancelNotice({ accessEndsLabel: nextBillingLabel })
    : null;

  return (
    <>
      <SettingsCard title="My plan">
        {successMessage ? (
          <div
            className="mb-5 rounded-xl border border-[#52B788]/40 bg-[#2D6A4F]/20 px-4 py-3"
            role="status"
          >
            <p className={settingsSuccessMessageClass}>{successMessage}</p>
          </div>
        ) : null}

        {pendingDowngradeNotice ? (
          <div className="mb-5 rounded-xl border border-[#52B788]/50 bg-[#2D6A4F]/15 px-4 py-4">
            <p className="text-sm font-medium leading-relaxed text-zinc-100">{pendingDowngradeNotice}</p>
            <button
              type="button"
              disabled={busy || previewLoading}
              onClick={() => void keepCurrentPlan("pending_downgrade")}
              className="mt-3 min-h-[44px] rounded-full border border-[#52B788] px-4 py-2 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/10 disabled:opacity-60"
            >
              Keep {formatMembershipLevelLabel(level)}
            </button>
          </div>
        ) : null}

        {pendingCancelNotice ? (
          <div className="mb-5 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-4">
            <p className="text-sm font-medium leading-relaxed text-yellow-100">{pendingCancelNotice}</p>
            <button
              type="button"
              disabled={busy || previewLoading}
              onClick={() => void keepCurrentPlan("scheduled_cancel")}
              className="mt-3 min-h-[44px] rounded-full border border-[#52B788] px-4 py-2 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/10 disabled:opacity-60"
            >
              Keep my membership
            </button>
          </div>
        ) : null}

        <p className={settingsBodyTextClass}>
          Current level:{" "}
          <span className={settingsAccentTextClass}>{formatMembershipLevelLabel(level)}</span>
        </p>
        <p className={`mt-1 ${settingsMutedTextClass}`}>
          {MEMBERSHIP_LEVELS[level].priceDisplay} - {MEMBERSHIP_LEVELS[level].shortDescription}
        </p>
        <p className={`mt-3 ${settingsMutedTextClass}`}>Next billing date: {nextBillingLabel}</p>
        <p className={`mt-1 ${settingsMutedTextClass}`}>Status: {statusLabel}</p>

        {status === "PAST_DUE" ? (
          <p className={`mt-3 ${settingsWarningTextClass}`}>
            Your last payment did not go through. Update your card within 7 days to keep access.
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {LEVEL_ORDER.filter((key) => key !== level).map((key) => {
            const rank = LEVEL_ORDER.indexOf(key) - LEVEL_ORDER.indexOf(level);
            const action = rank > 0 ? "upgrade" : "downgrade";
            return (
              <button
                key={key}
                type="button"
                disabled={busy || previewLoading}
                onClick={() => void openChangeModal(key, action)}
                className={settingsSecondaryButtonClass}
              >
                {action === "upgrade" ? "Upgrade" : "Downgrade"} to {formatMembershipLevelLabel(key)}
              </button>
            );
          })}
        </div>

        {!cancelAtPeriodEnd && !pendingLevel ? (
          <button
            type="button"
            disabled={busy || previewLoading}
            onClick={() => void openCancelModal()}
            className={`mt-4 ${settingsSecondaryButtonClass}`}
          >
            Cancel membership
          </button>
        ) : null}

        <div className="mt-4">
          <ManageBillingButton />
        </div>

        {errorMessage ? <p className="mt-3 text-sm text-red-300">{errorMessage}</p> : null}
      </SettingsCard>

      <PlanChangeConfirmModal
        open={modalOpen}
        content={modalContent}
        busy={busy}
        onClose={closeModal}
        onConfirm={() => void confirmModal()}
      />
    </>
  );
}
