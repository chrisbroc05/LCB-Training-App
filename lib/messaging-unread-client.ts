"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const MESSAGING_UNREAD_POLL_INTERVAL_MS = 30_000;

type CoachUnreadListener = (count: number) => void;

let coachUnreadCount = 0;
let coachUnreadLoaded = false;
const coachUnreadListeners = new Set<CoachUnreadListener>();

type PlayerMessageStatus = {
  access: "none" | "active" | "read_only";
  unreadCount: number;
};

type PlayerStatusListener = (status: PlayerMessageStatus) => void;

const defaultPlayerStatus: PlayerMessageStatus = { access: "none", unreadCount: 0 };
let playerMessageStatus = defaultPlayerStatus;
let playerStatusLoaded = false;
const playerStatusListeners = new Set<PlayerStatusListener>();

function emitCoachUnreadCount(count: number) {
  coachUnreadCount = count;
  coachUnreadLoaded = true;
  coachUnreadListeners.forEach((listener) => listener(count));
}

function emitPlayerMessageStatus(status: PlayerMessageStatus) {
  playerMessageStatus = status;
  playerStatusLoaded = true;
  playerStatusListeners.forEach((listener) => listener(status));
}

export function setCoachUnreadCount(count: number) {
  emitCoachUnreadCount(count);
}

export function setPlayerUnreadCount(unreadCount: number) {
  emitPlayerMessageStatus({
    ...playerMessageStatus,
    unreadCount,
  });
}

async function fetchCoachUnreadCount() {
  const response = await fetch("/api/admin/messages/unread-count", { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { unreadCount?: number };
  return data.unreadCount ?? 0;
}

export async function refreshCoachUnreadCount() {
  const count = await fetchCoachUnreadCount();
  if (count !== null) {
    emitCoachUnreadCount(count);
  }

  return count;
}

export async function fetchCoachInbox() {
  const response = await fetch("/api/admin/messages", { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  return (await response.json()) as {
    inbox?: Array<{
      id: string;
      enrollmentId: string;
      playerName: string;
      ageGroup: string | null;
      weekNumber: number;
      coachUnreadCount: number;
      lastMessageAt: string;
      lastMessagePreview: string | null;
    }>;
    unreadCount?: number;
  };
}

async function fetchPlayerMessageStatus() {
  const response = await fetch("/api/messages/status", { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  return (await response.json()) as PlayerMessageStatus;
}

export async function refreshPlayerMessageStatus() {
  const status = await fetchPlayerMessageStatus();
  if (status) {
    emitPlayerMessageStatus(status);
  }

  return status;
}

function useUnreadPolling(refresh: () => Promise<unknown>) {
  const pathname = usePathname();

  useEffect(() => {
    void refresh();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }, MESSAGING_UNREAD_POLL_INTERVAL_MS);

    const handleRefresh = () => {
      void refresh();
    };

    window.addEventListener("focus", handleRefresh);
    document.addEventListener("visibilitychange", handleRefresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleRefresh);
      document.removeEventListener("visibilitychange", handleRefresh);
    };
  }, [pathname, refresh]);
}

export function useCoachUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(coachUnreadLoaded ? coachUnreadCount : 0);

  useEffect(() => {
    const listener = (count: number) => setUnreadCount(count);
    coachUnreadListeners.add(listener);

    if (coachUnreadLoaded) {
      setUnreadCount(coachUnreadCount);
    }

    return () => {
      coachUnreadListeners.delete(listener);
    };
  }, []);

  useUnreadPolling(refreshCoachUnreadCount);

  return unreadCount;
}

export function usePlayerMessageStatus(enabled: boolean) {
  const [status, setStatus] = useState<PlayerMessageStatus>(
    playerStatusLoaded ? playerMessageStatus : defaultPlayerStatus,
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const listener = (nextStatus: PlayerMessageStatus) => setStatus(nextStatus);
    playerStatusListeners.add(listener);

    if (playerStatusLoaded) {
      setStatus(playerMessageStatus);
    }

    return () => {
      playerStatusListeners.delete(listener);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void refreshPlayerMessageStatus();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshPlayerMessageStatus();
      }
    }, MESSAGING_UNREAD_POLL_INTERVAL_MS);

    const handleRefresh = () => {
      void refreshPlayerMessageStatus();
    };

    window.addEventListener("focus", handleRefresh);
    document.addEventListener("visibilitychange", handleRefresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleRefresh);
      document.removeEventListener("visibilitychange", handleRefresh);
    };
  }, [enabled]);

  return status;
}
