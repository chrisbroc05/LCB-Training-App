export const PUSH_PROMPT_DISMISS_KEY = "lcb-push-prompt-dismissed-at";
export const PUSH_PROMPT_DISMISS_DAYS = 7;

export type PushNotificationTypeName =
  | "DAILY_WORK"
  | "DAY_BEFORE_START"
  | "SATURDAY_VIDEO"
  | "GONE_QUIET"
  | "COACH_RESPONSE"
  | "PLAN_UPDATE"
  | "TEST";

export type PushMessagePayload = {
  title: string;
  body: string;
  url: string;
};

export type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export function getPublicVapidKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? "";
}

export function isPushConfiguredOnClient() {
  return Boolean(getPublicVapidKey());
}

export function isIosDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

export function isStandalonePwa() {
  if (typeof window === "undefined") {
    return false;
  }

  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches
  );
}

export function canPromptForPushOnDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return false;
  }

  if (isIosDevice() && !isStandalonePwa()) {
    return false;
  }

  return isPushConfiguredOnClient();
}

export function shouldShowPushPromptDismissed() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const raw = window.localStorage.getItem(PUSH_PROMPT_DISMISS_KEY);
    if (!raw) {
      return true;
    }

    const dismissedAt = Number.parseInt(raw, 10);
    if (!Number.isFinite(dismissedAt)) {
      return true;
    }

    const elapsedMs = Date.now() - dismissedAt;
    return elapsedMs >= PUSH_PROMPT_DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return true;
  }
}

export function dismissPushPrompt() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PUSH_PROMPT_DISMISS_KEY, String(Date.now()));
  } catch {
    // ignore storage errors
  }
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }
  return outputArray;
}
