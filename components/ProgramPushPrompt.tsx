"use client";

import { useEffect, useState } from "react";
import {
  canPromptForPushOnDevice,
  dismissPushPrompt,
  isIosDevice,
  isPushConfiguredOnClient,
  isStandalonePwa,
  shouldShowPushPromptDismissed,
  urlBase64ToUint8Array,
} from "@/lib/push-shared";

const CARD =
  "mobile-card rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 shadow-sm";

type PushPromptState = "loading" | "hidden" | "ios_install" | "blocked" | "prompt";

export default function ProgramPushPrompt() {
  const [state, setState] = useState<PushPromptState>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      if (!isPushConfiguredOnClient()) {
        setState("hidden");
        return;
      }

      if (!shouldShowPushPromptDismissed()) {
        setState("hidden");
        return;
      }

      const statusResponse = await fetch("/api/push/status");
      if (!statusResponse.ok) {
        setState("hidden");
        return;
      }

      const statusData = (await statusResponse.json()) as {
        enabled?: boolean;
        subscribed?: boolean;
      };

      if (!statusData.enabled || statusData.subscribed) {
        setState("hidden");
        return;
      }

      if (isIosDevice() && !isStandalonePwa()) {
        setState("ios_install");
        return;
      }

      if (typeof Notification !== "undefined" && Notification.permission === "denied") {
        setState("blocked");
        return;
      }

      if (!canPromptForPushOnDevice()) {
        setState("hidden");
        return;
      }

      setState("prompt");
    })();
  }, []);

  const handleEnable = async () => {
    setBusy(true);
    setError("");

    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Push is not supported on this device.");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("blocked");
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
      if (!publicKey) {
        throw new Error("Push is not configured.");
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Unable to read push subscription.");
      }

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: {
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
          },
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Unable to save push subscription.");
      }

      setState("hidden");
    } catch (enableError) {
      setError(enableError instanceof Error ? enableError.message : "Unable to turn on notifications.");
    } finally {
      setBusy(false);
    }
  };

  const handleDismiss = () => {
    dismissPushPrompt();
    setState("hidden");
  };

  if (state === "loading" || state === "hidden") {
    return null;
  }

  if (state === "ios_install") {
    return (
      <section className={`${CARD} border-[#52B788]/40`}>
        <p className="text-sm font-semibold text-zinc-100">Turn on notifications</p>
        <p className="mt-2 text-sm text-zinc-400">
          1. Tap the Share button at the bottom of Safari.
          <br />
          2. Tap Add to Home Screen.
          <br />
          3. Open LCB from your home screen and turn on notifications here.
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          className="mt-3 rounded-full border border-[#2b3650] px-4 py-2 text-xs font-semibold text-zinc-400"
        >
          Not now
        </button>
      </section>
    );
  }

  if (state === "blocked") {
    return (
      <section className={`${CARD} border-[#52B788]/40`}>
        <p className="text-sm font-semibold text-zinc-100">Turn on notifications</p>
        <p className="mt-2 text-sm text-zinc-400">
          Notifications are blocked. Turn them on in your phone settings for LCB.
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          className="mt-3 rounded-full border border-[#2b3650] px-4 py-2 text-xs font-semibold text-zinc-400"
        >
          Not now
        </button>
      </section>
    );
  }

  return (
    <section className={`${CARD} border-[#52B788]/40`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-100">Turn on notifications</p>
          <p className="mt-1 text-sm text-zinc-400">
            Get a heads-up when your work is ready and when I respond to your videos.
          </p>
          {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
          <button
            type="button"
            onClick={() => void handleEnable()}
            disabled={busy}
            className="mt-3 rounded-full bg-[#2D6A4F] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Turning on..." : "Turn on"}
          </button>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-full border border-[#2b3650] px-3 py-1 text-xs font-semibold text-zinc-400"
        >
          Not now
        </button>
      </div>
    </section>
  );
}
