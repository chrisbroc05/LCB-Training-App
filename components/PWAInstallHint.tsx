"use client";

import { useEffect, useState } from "react";

export default function PWAInstallHint() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem("pwa-hint-dismissed");
      if (dismissed) {
        return;
      }

      const isIOSDevice =
        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !("MSStream" in window);
      const isAndroid = /Android/.test(navigator.userAgent);
      const isStandalone =
        ("standalone" in navigator &&
          (navigator as Navigator & { standalone?: boolean }).standalone === true) ||
        window.matchMedia("(display-mode: standalone)").matches;

      if (isStandalone) {
        return;
      }
      if (!isIOSDevice && !isAndroid) {
        return;
      }

      setIsIOS(isIOSDevice);

      const timer = setTimeout(() => {
        setShow(true);
      }, 2000);

      return () => clearTimeout(timer);
    } catch {
      return;
    }
  }, []);

  const dismiss = () => {
    try {
      sessionStorage.setItem("pwa-hint-dismissed", "true");
      setShow(false);
    } catch {
      setShow(false);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "100px",
        left: "16px",
        right: "16px",
        backgroundColor: "#1a2f4a",
        border: "1px solid #52B788",
        borderRadius: "16px",
        padding: "16px",
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        animation: "slideUp 0.3s ease-out",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <img
        src="/apple-touch-icon.png"
        alt="LCB Training"
        style={{ width: "40px", height: "40px", borderRadius: "8px", flexShrink: 0 }}
        onError={(event) => {
          (event.target as HTMLImageElement).style.display = "none";
        }}
      />
      <div style={{ flex: 1 }}>
        <p
          style={{
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: "600",
            marginBottom: "4px",
            lineHeight: "1.4",
          }}
        >
          Add LCB Training to your home screen
        </p>
        <p
          style={{
            color: "#aaaaaa",
            fontSize: "12px",
            lineHeight: "1.4",
          }}
        >
          {isIOS
            ? "Tap the Share button at the bottom of your browser, then tap Add to Home Screen"
            : "Tap the three dot menu at the top right of your browser, then tap Add to Home Screen"}
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        style={{
          background: "none",
          border: "none",
          color: "#aaaaaa",
          fontSize: "18px",
          cursor: "pointer",
          padding: "0",
          lineHeight: "1",
          flexShrink: 0,
        }}
      >
        x
      </button>
    </div>
  );
}
