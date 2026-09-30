"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import MobileBottomSheet from "@/app/components/mobile/MobileBottomSheet";
import {
  NON_PROGRAM_CHAT_SHEET_TITLE,
  shouldShowMessageBubble,
} from "@/lib/direct-messaging-shared";
import { usePlayerMessageStatus } from "@/lib/messaging-unread-client";

type MessageChatBubbleProps = {
  isLoggedIn: boolean;
};

function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 9h10M7 13h6M21 12c0 3.866-3.582 7-8 7-.847 0-1.66-.12-2.41-.34L3 19l1.55-4.04A7.7 7.7 0 0 1 3 12c0-3.866 3.582-7 8-7s8 3.134 8 7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MessageChatBubble({ isLoggedIn }: MessageChatBubbleProps) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const shouldTrackUnread = isLoggedIn && !pathname.startsWith("/messages");
  const status = usePlayerMessageStatus(shouldTrackUnread);

  if (!shouldShowMessageBubble(pathname)) {
    return null;
  }

  const canOpenChat = isLoggedIn && (status.access === "active" || status.access === "read_only");

  const bubble = (
    <>
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#2D6A4F] text-[#F4F6F8] shadow-lg shadow-black/30">
        <ChatIcon />
      </span>
      {status.unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#ef4444] px-1.5 text-[11px] font-semibold text-white">
          {status.unreadCount > 9 ? "9+" : status.unreadCount}
        </span>
      ) : null}
    </>
  );

  return (
    <>
      <div className="message-chat-bubble fixed right-4 z-[65] md:right-6">
        {canOpenChat ? (
          <Link href="/messages" aria-label="Open messages" className="relative inline-flex">
            {bubble}
          </Link>
        ) : (
          <button
            type="button"
            aria-label="Message Coach Broc"
            onClick={() => setSheetOpen(true)}
            className="relative inline-flex"
          >
            {bubble}
          </button>
        )}
      </div>

      <MobileBottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Message Coach Broc"
        ariaLabel="Message Coach Broc"
      >
        <p className="text-sm leading-relaxed text-zinc-300">{NON_PROGRAM_CHAT_SHEET_TITLE}</p>
        <Link
          href="/program"
          onClick={() => setSheetOpen(false)}
          className="mt-5 inline-flex rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black"
        >
          View the 12-Week Program
        </Link>
      </MobileBottomSheet>
    </>
  );
}
