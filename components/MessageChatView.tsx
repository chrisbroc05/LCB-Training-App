"use client";

import { useEffect, useRef, useState } from "react";
import { formatTime } from "@/lib/format-date";
import {
  MESSAGE_BODY_MAX_LENGTH,
  MESSAGE_POLL_INTERVAL_MS,
  PLAYER_CHAT_DISCLAIMER,
  PROGRAM_ENDED_CHAT_MESSAGE,
} from "@/lib/direct-messaging-shared";

export type MessageChatItem = {
  id: string;
  body: string;
  fromCoach: boolean;
  createdAt: string;
  readAt: string | null;
};

type MessageChatViewProps = {
  messages: MessageChatItem[];
  readOnly?: boolean;
  readOnlyMessage?: string;
  showDisclaimer?: boolean;
  sending?: boolean;
  error?: string;
  onSend?: (body: string) => Promise<void>;
  onPoll?: () => Promise<void>;
  onMarkRead?: () => Promise<void>;
};

export default function MessageChatView({
  messages,
  readOnly = false,
  readOnlyMessage,
  showDisclaimer = false,
  sending = false,
  error = "",
  onSend,
  onPoll,
  onMarkRead,
}: MessageChatViewProps) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!onPoll) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void onPoll();
    }, MESSAGE_POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [onPoll]);

  useEffect(() => {
    if (!onMarkRead) {
      return;
    }

    void onMarkRead();
  }, [messages, onMarkRead]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onSend || readOnly || !draft.trim()) {
      return;
    }

    const body = draft;
    setDraft("");
    await onSend(body);
  };

  return (
    <div className="flex min-h-[60vh] flex-col">
      {showDisclaimer ? (
        <p className="mb-4 text-xs leading-relaxed text-zinc-500">{PLAYER_CHAT_DISCLAIMER}</p>
      ) : null}

      {readOnly && readOnlyMessage ? (
        <p className="mb-4 rounded-xl border border-[#2b3650] bg-[#0A1628]/60 px-4 py-3 text-sm text-zinc-400">
          {readOnlyMessage}
        </p>
      ) : null}

      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.fromCoach ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                message.fromCoach
                  ? "rounded-bl-md bg-[#1a253a] text-zinc-100"
                  : "rounded-br-md bg-[#2D6A4F] text-[#F4F6F8]"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
              <p className="mt-2 text-[11px] opacity-70">{formatTime(message.createdAt)}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {!readOnly ? (
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 border-t border-[#2b3650] pt-4">
          <label className="sr-only" htmlFor="message-body">
            Message
          </label>
          <textarea
            id="message-body"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={MESSAGE_BODY_MAX_LENGTH}
            rows={3}
            placeholder="Write a message..."
            className="w-full rounded-xl border border-[#2b3650] bg-[#0A1628]/80 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#52B788] focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">
              {draft.length}/{MESSAGE_BODY_MAX_LENGTH}
            </p>
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="rounded-full bg-[#22c55e] px-5 py-2 text-sm font-semibold text-black disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
          {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
        </form>
      ) : null}
    </div>
  );
}

export { PROGRAM_ENDED_CHAT_MESSAGE };
