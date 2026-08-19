"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import MobileBottomSheet from "@/app/components/mobile/MobileBottomSheet";

type NotificationItem = {
  id: number;
  title: string;
  body: string | null;
  type: string;
  read: boolean;
  linkUrl: string | null;
  createdAt: string;
};

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 17H9l-.5 2h7l-.5-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function MobileNotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as {
        notifications: NotificationItem[];
        unreadCount: number;
      };

      setNotifications(payload.notifications ?? []);
      setUnreadCount(payload.unreadCount ?? 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleOpen = () => {
    setIsOpen(true);
    loadNotifications();
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch {
      // Ignore mark-all failures in the UI.
    }
  };

  const handleNotificationTap = async (notification: NotificationItem) => {
    if (!notification.read) {
      try {
        await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: notification.id }),
        });
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, read: true } : item,
          ),
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        // Continue navigation even if mark-read fails.
      }
    }

    setIsOpen(false);

    if (notification.linkUrl) {
      router.push(notification.linkUrl);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="mobile-notification-button"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
      >
        <BellIcon />
        {unreadCount > 0 ? <span className="mobile-notification-badge" aria-hidden="true" /> : null}
      </button>

      <MobileBottomSheet
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Notifications"
        ariaLabel="Notifications"
      >
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={markAllAsRead}
            className="mb-3 inline-flex h-10 w-full items-center justify-center rounded-full border border-[#2b3650] text-sm font-semibold text-zinc-200"
          >
            Mark all as read
          </button>
        ) : null}
        {isLoading ? (
          <p className="py-6 text-center text-sm text-zinc-400">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">
            You are all set. No new notifications.
          </p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => handleNotificationTap(notification)}
                  className="mobile-notification-item"
                >
                  <span
                    className={`mobile-notification-dot ${notification.read ? "is-read" : ""}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block text-sm font-semibold text-zinc-100">
                      {notification.title}
                    </span>
                    {notification.body ? (
                      <span className="mt-1 block text-xs text-zinc-400">{notification.body}</span>
                    ) : null}
                    <span className="mt-1 block text-xs text-zinc-500">
                      {formatNotificationTime(notification.createdAt)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </MobileBottomSheet>
    </>
  );
}
