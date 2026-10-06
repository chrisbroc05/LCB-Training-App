"use client";

import MessageChatView from "@/components/MessageChatView";
import { DEMO_CHAT_MESSAGES } from "@/app/admin/social/app-highlight/demo-data";

export default function DemoChatScreen() {
  return (
    <div className="max-h-[560px] overflow-hidden p-3">
      <MessageChatView messages={DEMO_CHAT_MESSAGES} readOnly showDisclaimer={false} />
    </div>
  );
}
