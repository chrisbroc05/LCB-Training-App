"use client";

import { useEffect, useState } from "react";
import type { CoachAlertSettingsState } from "@/lib/coach-push-shared";
import {
  canPromptForPushOnDevice,
  isIosDevice,
  isPushConfiguredOnClient,
  isStandalonePwa,
  urlBase64ToUint8Array,
} from "@/lib/push-shared";

const CARD =
  "rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8";

type CoachAlertsState = {
  enabled: boolean;
  subscribed: boolean;
  settings: CoachAlertSettingsState;
};

function ToggleRow(props: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#2b3650]/80 py-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-100">{props.label}</p>
        <p className="mt-1 text-sm text-zinc-400">{props.description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={props.checked}
        aria-label={props.label}
        disabled={props.disabled}
        onClick={() => props.onChange(!props.checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
          props.checked ? "bg-[#52B788]" : "bg-zinc-600"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            props.checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function AdminProgramCoachAlerts() {
  const [state, setState] = useState<CoachAlertsState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [iosInstallHint, setIosInstallHint] = useState(false);
  const [permissionBlocked, setPermissionBlocked] = useState(false);

  const loadState = async () => {
    setIsLoading(true);
    const response = await fetch("/api/admin/coach-alerts");
    setIsLoading(false);

    if (!response.ok) {
      setErrorMessage("Unable to load coach alert settings.");
      return;
    }

    const data = (await response.json()) as CoachAlertsState;
    setState(data);
  };

  useEffect(() => {
    void loadState();
  }, []);

  const saveSettings = async (payload: Partial<CoachAlertSettingsState>) => {
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const response = await fetch("/api/admin/coach-alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      settings?: CoachAlertSettingsState;
    };

    setIsSaving(false);

    if (!response.ok || !data.settings) {
      setErrorMessage(data.error ?? "Unable to save coach alert settings.");
      return false;
    }

    setState((current) =>
      current
        ? {
            ...current,
            settings: data.settings!,
          }
        : current,
    );
    setSuccessMessage("Saved.");
    return true;
  };

  const subscribe = async () => {
    if (!canPromptForPushOnDevice()) {
      if (isIosDevice() && !isStandalonePwa()) {
        setIosInstallHint(true);
      } else {
        setErrorMessage("Push is not available on this device.");
      }
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setPermissionBlocked(true);
      setErrorMessage("Notifications are blocked. Turn them on in your phone settings for LCB.");
      return false;
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
    if (!publicKey) {
      setErrorMessage("Push is not configured.");
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      setErrorMessage("Unable to read push subscription.");
      return false;
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
      setErrorMessage(data.error ?? "Unable to turn on coach alerts.");
      return false;
    }

    setState((current) =>
      current
        ? {
            ...current,
            subscribed: true,
          }
        : current,
    );
    setIosInstallHint(false);
    setPermissionBlocked(false);
    setSuccessMessage("Coach alerts turned on for this phone.");
    return true;
  };

  const handleTest = async () => {
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const response = await fetch("/api/push/test", { method: "POST" });
    const data = (await response.json().catch(() => ({}))) as { error?: string };

    setIsSaving(false);

    if (!response.ok) {
      setErrorMessage(data.error ?? "Unable to send test push.");
      return;
    }

    setSuccessMessage("Test push sent.");
  };

  return (
    <section className={CARD}>
      <h2 className="text-xl font-semibold text-zinc-100">Coach alerts</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Get instant alerts for new videos and program purchases, plus a nightly summary push on
        this phone.
      </p>

      {isLoading ? <p className="mt-4 text-sm text-zinc-400">Loading...</p> : null}

      {!isLoading && state ? (
        <div className="mt-5 space-y-4">
          <p className="text-sm text-zinc-400">
            Status: {state.subscribed ? "On" : "Off"}
            {!isPushConfiguredOnClient() ? " (not configured)" : ""}
          </p>

          {iosInstallHint ? (
            <div className="rounded-xl border border-[#52B788]/40 p-4 text-sm text-zinc-300">
              <p className="font-semibold text-zinc-100">Add LCB to your home screen first</p>
              <p className="mt-2 text-zinc-400">
                1. Tap the Share button at the bottom of Safari.
                <br />
                2. Tap Add to Home Screen.
                <br />
                3. Open LCB from your home screen and turn on alerts here.
              </p>
            </div>
          ) : null}

          {permissionBlocked ? (
            <p className="text-sm text-zinc-400">
              Notifications are blocked. Turn them on in your phone settings for LCB.
            </p>
          ) : null}

          {!state.subscribed && !iosInstallHint && !permissionBlocked ? (
            <button
              type="button"
              disabled={isSaving || !state.enabled}
              onClick={() => void subscribe()}
              className="rounded-full bg-[#2D6A4F] px-5 py-2.5 text-sm font-semibold text-[#F4F6F8] disabled:opacity-60"
            >
              Turn on alerts on this phone
            </button>
          ) : null}

          {state.subscribed ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void handleTest()}
              className="rounded-full bg-[#2D6A4F] px-5 py-2.5 text-sm font-semibold text-[#F4F6F8] disabled:opacity-60"
            >
              Send me a test
            </button>
          ) : null}

          <div className="border-t border-[#2b3650] pt-2">
            <ToggleRow
              label="New videos"
              description="Alert when a player submits swing analysis or mental game video."
              checked={state.settings.newVideosEnabled}
              disabled={isSaving}
              onChange={(checked) => {
                void saveSettings({ newVideosEnabled: checked });
              }}
            />
            <ToggleRow
              label="New program players"
              description="Alert when someone buys the 12-week program."
              checked={state.settings.newProgramPlayersEnabled}
              disabled={isSaving}
              onChange={(checked) => {
                void saveSettings({ newProgramPlayersEnabled: checked });
              }}
            />
            <ToggleRow
              label="Nightly summary push"
              description="One push at 8:30pm Chicago with the day recap."
              checked={state.settings.nightlySummaryPushEnabled}
              disabled={isSaving}
              onChange={(checked) => {
                void saveSettings({ nightlySummaryPushEnabled: checked });
              }}
            />
            <ToggleRow
              label="Email me the nightly summary"
              description="Keep the existing coach summary email at 8:30pm Chicago."
              checked={state.settings.emailNightlySummaryEnabled}
              disabled={isSaving}
              onChange={(checked) => {
                void saveSettings({ emailNightlySummaryEnabled: checked });
              }}
            />
          </div>
        </div>
      ) : null}

      {errorMessage ? <p className="mt-4 text-sm text-red-300">{errorMessage}</p> : null}
      {successMessage ? <p className="mt-4 text-sm text-[#52B788]">{successMessage}</p> : null}
    </section>
  );
}
