"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminMessagesNavLink() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/admin/messages");
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { unreadCount?: number };
      setUnreadCount(data.unreadCount ?? 0);
    };

    void load();
  }, []);

  return (
    <Link
      href="/admin/messages"
      className="relative inline-flex items-center rounded-lg px-3 py-2 text-sm text-zinc-200 transition hover:bg-[#1a253a] hover:text-[#9df3bd]"
    >
      Messages
      {unreadCount > 0 ? (
        <span className="ml-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#ef4444] px-1.5 text-[11px] font-semibold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
