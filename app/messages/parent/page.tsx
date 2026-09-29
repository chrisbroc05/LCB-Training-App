"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import MessageChatView, { type MessageChatItem } from "@/components/MessageChatView";

export default function ParentMessagesPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [playerName, setPlayerName] = useState("");
  const [messages, setMessages] = useState<MessageChatItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError("This link is invalid.");
      setLoading(false);
      return;
    }

    const load = async () => {
      const response = await fetch(`/api/messages/parent?token=${encodeURIComponent(token)}`);
      const data = (await response.json().catch(() => ({}))) as {
        playerName?: string;
        messages?: MessageChatItem[];
        error?: string;
      };

      setLoading(false);

      if (!response.ok) {
        setError(data.error ?? "Unable to load messages.");
        return;
      }

      setPlayerName(data.playerName ?? "Player");
      setMessages(data.messages ?? []);
    };

    void load();
  }, [token]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <p className="text-sm text-zinc-400">Loading messages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <p className="text-sm text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold text-zinc-100">{playerName} and Coach Broc</h1>
      <p className="mt-2 text-sm text-zinc-400">Read-only view for parents and second email.</p>
      <div className="mt-6 rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-6">
        <MessageChatView messages={messages} readOnly />
      </div>
    </div>
  );
}
