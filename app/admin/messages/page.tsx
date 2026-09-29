"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format-date";
import { PROGRAM_AGE_GROUP_LABELS, type ProgramAgeGroup } from "@/lib/program-enrollment-shared";
import { truncateMessagePreview } from "@/lib/direct-messaging-shared";

type InboxItem = {
  id: string;
  enrollmentId: string;
  playerName: string;
  ageGroup: ProgramAgeGroup | null;
  weekNumber: number;
  coachUnreadCount: number;
  lastMessageAt: string;
  lastMessagePreview: string | null;
};

export default function AdminMessagesPage() {
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/admin/messages");
      const data = (await response.json().catch(() => ({}))) as {
        inbox?: InboxItem[];
        unreadCount?: number;
      };

      setLoading(false);
      if (response.ok) {
        setInbox(data.inbox ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    };

    void load();
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Messages</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        <Link href="/admin/program" className="text-sm font-semibold text-[#52B788]">
          Program overview
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? <p className="text-sm text-zinc-400">Loading...</p> : null}
        {!loading && inbox.length === 0 ? (
          <p className="text-sm text-zinc-400">No conversations yet.</p>
        ) : null}
        {inbox.map((item) => (
          <Link
            key={item.id}
            href={`/admin/messages/${item.id}`}
            className="block rounded-2xl border border-[#2b3650] bg-[#0b1324]/80 px-4 py-4 transition hover:border-[#52B788]/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-zinc-100">
                  {item.playerName}
                  {item.coachUnreadCount > 0 ? (
                    <span className="ml-2 inline-flex rounded-full bg-[#ef4444] px-2 py-0.5 text-[11px] font-semibold text-white">
                      {item.coachUnreadCount}
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {item.ageGroup ? PROGRAM_AGE_GROUP_LABELS[item.ageGroup] : "Age n/a"} | Week{" "}
                  {item.weekNumber}
                </p>
                {item.lastMessagePreview ? (
                  <p className="mt-2 truncate text-sm text-zinc-400">
                    {truncateMessagePreview(item.lastMessagePreview, 100)}
                  </p>
                ) : null}
              </div>
              <p className="shrink-0 text-xs text-zinc-500">{formatDateTime(item.lastMessageAt)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
