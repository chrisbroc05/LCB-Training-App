"use client";

import { useEffect } from "react";
import ResponsiveOverlay from "@/app/components/mobile/ResponsiveOverlay";
import type { PlanChangeModalContent } from "@/lib/membership-change-shared";

type PlanChangeConfirmModalProps = {
  open: boolean;
  content: PlanChangeModalContent | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black"
      aria-hidden="true"
    />
  );
}

export default function PlanChangeConfirmModal({
  open,
  content,
  busy,
  onClose,
  onConfirm,
}: PlanChangeConfirmModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, busy, onClose]);

  if (!content) {
    return null;
  }

  const footer = (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        disabled={busy}
        onClick={onClose}
        className="min-h-[48px] rounded-full border border-[#2b3650] bg-[#0A1628] px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-[#52B788] hover:text-[#52B788] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {content.dismissLabel}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onConfirm}
        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#2D6A4F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#52B788] hover:text-[#0A1628] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? <Spinner /> : null}
        {content.confirmLabel}
      </button>
    </div>
  );

  return (
    <ResponsiveOverlay
      open={open}
      onClose={busy ? () => undefined : onClose}
      title={content.title}
      footer={footer}
      ariaLabel={content.title}
      desktopClassName="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      desktopPanelClassName="w-full max-w-md rounded-2xl border border-[#1e2d45] bg-[#0A1628] p-6 shadow-2xl"
    >
      <p className="text-sm leading-relaxed text-zinc-300">{content.body}</p>
    </ResponsiveOverlay>
  );
}
