"use client";

import MobileBottomSheet from "@/app/components/mobile/MobileBottomSheet";
import { useIsMobile } from "@/app/components/mobile/useIsMobile";

type ResponsiveOverlayProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  ariaLabel?: string;
  desktopClassName?: string;
  desktopPanelClassName?: string;
};

export default function ResponsiveOverlay({
  open,
  onClose,
  title,
  children,
  footer,
  ariaLabel,
  desktopClassName = "fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4",
  desktopPanelClassName = "w-full max-w-lg rounded-2xl border border-[#18243a] bg-[#0b1324] p-5 shadow-2xl",
}: ResponsiveOverlayProps) {
  const isMobile = useIsMobile();

  if (!open) {
    return null;
  }

  if (isMobile) {
    return (
      <MobileBottomSheet
        open={open}
        onClose={onClose}
        title={title}
        footer={footer}
        ariaLabel={ariaLabel}
      >
        {children}
      </MobileBottomSheet>
    );
  }

  return (
    <div
      className={desktopClassName}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title ?? "Dialog"}
        className={desktopPanelClassName}
        onClick={(event) => event.stopPropagation()}
      >
        {title ? <h2 className="text-xl font-semibold text-zinc-100">{title}</h2> : null}
        <div className={title ? "mt-4" : ""}>{children}</div>
        {footer ? <div className="mt-5">{footer}</div> : null}
      </div>
    </div>
  );
}
