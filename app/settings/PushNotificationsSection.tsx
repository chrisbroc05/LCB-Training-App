"use client";

import { useEffect, useState } from "react";
import SettingsCard from "@/app/settings/SettingsCard";
import ToggleSwitch from "@/app/settings/ToggleSwitch";
import {
  settingsErrorMessageClass,
  settingsMutedTextClass,
  settingsSuccessMessageClass,
} from "@/app/settings/settings-styles";
import {
  canPromptForPushOnDevice,
  isIosDevice,
  isPushConfiguredOnClient,
  isStandalonePwa,
  urlBase64ToUint8Array,
} from "@/lib/push-shared";

export default function PushNotificationsSection() {
  const [subscribed, setSubscribed] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSection, setShowSection] = useState(false);

  const loadStatus = async () => {
    setIsLoading(true);
    const response = await fetch("/api/push/status");
    setIsLoading(false);

    if (response.status === 401) {
      setShowSection(false);
      return;
    }

    if (!response.ok) {
      setErrorMessage("Unable to load push notification status.");
      return;
    }

    const data = (await response.json()) as {
      enabled?: boolean;
      subscribed?: boolean;
    };

    setEnabled(Boolean(data.enabled));
    setSubscribed(Boolean(data.subscribed));
    setShowSection(Boolean(data.enabled));
  };

  useEffect(() => {
    void loadStatus();
  }, []);

  const subscribe = async () => {
    if (!canPromptForPushOnDevice()) {
      if (isIosDevice() && !isStandalonePwa()) {
        setErrorMessage(
          "On iPhone, add LCB to your home screen first, then turn on notifications here.",
        );
      } else {
        setErrorMessage("Push is not available on this device.");
      }
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
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
      setErrorMessage(data.error ?? "Unable to turn on push notifications.");
      return false;
    }

    setSubscribed(true);
    return true;
  };

  const unsubscribe = async () => {
    const response = await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      setErrorMessage("Unable to turn off push notifications.");
      return false;
    }

    setSubscribed(false);
    return true;
  };

  const handleToggle = async (checked: boolean) => {
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const ok = checked ? await subscribe() : await unsubscribe();
    setIsSaving(false);

    if (ok) {
      setSuccessMessage(checked ? "Push notifications turned on." : "Push notifications turned off.");
    }
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

  if (!showSection && !isLoading) {
    return null;
  }

  return (
    <SettingsCard
      id="push-notifications"
      title="Push notifications"
      description="Get notified when your daily work is ready and when Coach Broc responds."
    >
      {isLoading ? <p className={settingsMutedTextClass}>Loading...</p> : null}

      {!isLoading && enabled ? (
        <div className="space-y-4">
          <p className={settingsMutedTextClass}>
            Status: {subscribed ? "On" : "Off"}
            {!isPushConfiguredOnClient() ? " (not configured)" : ""}
          </p>

          <ToggleSwitch
            label="Push notifications"
            description="Turn on browser or home screen app notifications."
            checked={subscribed}
            disabled={isSaving}
            onChange={(checked) => {
              void handleToggle(checked);
            }}
          />

          <button
            type="button"
            disabled={isSaving || !subscribed}
            onClick={() => void handleTest()}
            className="rounded-full border border-[#0A1628]/15 px-5 py-2.5 text-sm font-semibold text-[#0A1628] disabled:opacity-60"
          >
            Send me a test
          </button>
        </div>
      ) : null}

      {errorMessage ? <p className={settingsErrorMessageClass}>{errorMessage}</p> : null}
      {successMessage ? <p className={settingsSuccessMessageClass}>{successMessage}</p> : null}
    </SettingsCard>
  );
}
