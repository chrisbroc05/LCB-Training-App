"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MessageChatView, { type MessageChatItem } from "@/components/MessageChatView";

export default function AdminConversationPage() {
  const params = useParams<{ conversationId: string }>();
  const conversationId = params.conversationId;
  const [playerName, setPlayerName] = useState("");
  const [enrollmentId, setEnrollmentId] = useState("");
  const [messages, setMessages] = useState<MessageChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadMessages = useCallback(async () => {
    const response = await fetch(`/api/admin/messages/${conversationId}`);
    const data = (await response.json().catch(() => ({}))) as {
      conversation?: { playerName: string; enrollmentId: string };
      messages?: MessageChatItem[];
      error?: string;
    };

    if (!response.ok) {
      setError(data.error ?? "Unable to load conversation.");
      setLoading(false);
      return;
    }

    setPlayerName(data.conversation?.playerName ?? "Player");
    setEnrollmentId(data.conversation?.enrollmentId ?? "");
    setMessages(data.messages ?? []);
    setLoading(false);
    setError("");
  }, [conversationId]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const markRead = useCallback(async () => {
    await fetch(`/api/admin/messages/${conversationId}`, { method: "PATCH" });
  }, [conversationId]);

  const handleSend = async (body: string) => {
    setSending(true);
    setError("");

    const response = await fetch(`/api/admin/messages/${conversationId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      message?: MessageChatItem;
      error?: string;
    };

    setSending(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to send message.");
      return;
    }

    if (data.message) {
      setMessages((current) => [...current, data.message!]);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <p className="text-sm text-zinc-400">Loading conversation...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">{playerName}</h1>
          <p className="mt-1 text-sm text-zinc-400">Direct messages</p>
        </div>
        <div className="flex gap-3 text-sm">
          {enrollmentId ? (
            <Link href={`/admin/program/${enrollmentId}`} className="font-semibold text-[#52B788]">
              Player page
            </Link>
          ) : null}
          <Link href="/admin/messages" className="font-semibold text-zinc-400">
            Inbox
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-6">
        <MessageChatView
          messages={messages}
          sending={sending}
          error={error}
          onSend={handleSend}
          onPoll={loadMessages}
          onMarkRead={markRead}
        />
      </div>
    </div>
  );
}
