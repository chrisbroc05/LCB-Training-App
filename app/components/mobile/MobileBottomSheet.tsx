"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type MobileBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  ariaLabel?: string;
  variant?: "default" | "cinematic";
  showCloseButton?: boolean;
};

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function MobileBottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  ariaLabel,
  variant = "default",
  showCloseButton = false,
}: MobileBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const dragStartY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [mounted, setMounted] = useState(false);
  const isCinematic = variant === "cinematic";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setDragOffset(0);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!mounted || !open) {
    return null;
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    dragStartY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) {
      return;
    }

    const currentY = event.touches[0]?.clientY ?? dragStartY.current;
    const delta = Math.max(0, currentY - dragStartY.current);
    setDragOffset(delta);
  };

  const handleTouchEnd = () => {
    if (dragOffset > 120) {
      onClose();
    }

    dragStartY.current = null;
    setDragOffset(0);
  };

  return createPortal(
    <div className="mobile-sheet-root md:hidden">
      <button
        type="button"
        aria-label="Close sheet"
        className="mobile-sheet-overlay"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title ?? "Bottom sheet"}
        className={`mobile-sheet-panel ${isCinematic ? "mobile-sheet-panel-cinematic" : ""}`}
        style={{ transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="mobile-sheet-handle-wrap"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="mobile-sheet-handle" />
        </div>
        {showCloseButton ? (
          <button
            type="button"
            onClick={onClose}
            className="mobile-sheet-close-button"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        ) : null}
        {title && !isCinematic ? <h2 className="mobile-sheet-title">{title}</h2> : null}
        <div className={`mobile-sheet-body ${isCinematic ? "mobile-sheet-body-cinematic" : ""}`}>
          {children}
        </div>
        {footer ? <div className="mobile-sheet-footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
