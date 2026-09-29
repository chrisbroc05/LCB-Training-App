"use client";

import { useCallback, useEffect, useState } from "react";
import MessageChatView, {
  PROGRAM_ENDED_CHAT_MESSAGE,
  type MessageChatItem,
} from "@/components/MessageChatView";

export default function MessagesPage() {
  const [messages, setMessages] = useState<MessageChatItem[]>([]);
  const [access, setAccess] = useState<"none" | "active" | "read_only">("none");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadMessages = useCallback(async () => {
    const response = await fetch("/api/messages");
    const data = (await response.json().catch(() => ({}))) as {
      access?: "none" | "active" | "read_only";
      messages?: MessageChatItem[];
      error?: string;
    };

    if (!response.ok) {
      setError(data.error ?? "Unable to load messages.");
      setLoading(false);
      return;
    }

    setAccess(data.access ?? "none");
    setMessages(data.messages ?? []);
    setLoading(false);
    setError("");
  }, []);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const markRead = useCallback(async () => {
    await fetch("/api/messages", { method: "PATCH" });
  }, []);

  const handleSend = async (body: string) => {
    setSending(true);
    setError("");

    const response = await fetch("/api/messages", {
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
        <p className="text-sm text-zinc-400">Loading messages...</p>
      </div>
    );
  }

  if (access === "none") {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <p className="text-sm text-zinc-400">Messaging is available with the 12-Week Program.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold text-zinc-100">Messages</h1>
      <div className="mt-6 rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-6">
        <MessageChatView
          messages={messages}
          readOnly={access === "read_only"}
          readOnlyMessage={access === "read_only" ? PROGRAM_ENDED_CHAT_MESSAGE : undefined}
          showDisclaimer={access === "active"}
          sending={sending}
          error={error}
          onSend={access === "active" ? handleSend : undefined}
          onPoll={loadMessages}
          onMarkRead={markRead}
        />
      </div>
    </div>
  );
}
