export const MESSAGE_BODY_MIN_LENGTH = 1;

export const MESSAGE_BODY_MAX_LENGTH = 1000;

export const PLAYER_MESSAGE_RATE_LIMIT = 20;

export const PLAYER_MESSAGE_RATE_WINDOW_MS = 60 * 60 * 1000;

export const MESSAGE_POLL_INTERVAL_MS = 15_000;

export const COACH_REPLY_PUSH_TITLE = "Coach Broc replied";

export const COACH_NEW_MESSAGE_PUSH_TITLE_PREFIX = "Message from";

export const PLAYER_CHAT_DISCLAIMER =
  "I usually reply within 24 hours. Your parent or second email can see these messages.";

export const PROGRAM_ENDED_CHAT_MESSAGE =
  "Your program has ended. Reach out anytime at chrisbroc05@gmail.com.";

export const NON_PROGRAM_CHAT_SHEET_TITLE = "Message Coach Broc directly with the 12-Week Program.";

export const PLAYER_MESSAGE_RATE_LIMIT_MESSAGE =
  "You can send up to 20 messages per hour. Try again a little later.";

export function truncateMessagePreview(body: string, maxLength = 80) {
  const trimmed = body.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 3)}...`;
}

export function normalizeMessageBody(body: string) {
  return body.replace(/\r\n/g, "\n").trim();
}

export function validateMessageBody(body: string) {
  const normalized = normalizeMessageBody(body);
  if (normalized.length < MESSAGE_BODY_MIN_LENGTH) {
    return { ok: false as const, error: "Message cannot be empty." };
  }

  if (normalized.length > MESSAGE_BODY_MAX_LENGTH) {
    return {
      ok: false as const,
      error: `Message must be ${MESSAGE_BODY_MAX_LENGTH} characters or less.`,
    };
  }

  return { ok: true as const, body: normalized };
}

export function escapeMessageForDisplay(body: string) {
  return body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function shouldShowMessageBubble(pathname: string) {
  if (pathname.startsWith("/admin")) {
    return false;
  }

  if (pathname.startsWith("/auth")) {
    return false;
  }

  if (pathname.startsWith("/program/start")) {
    return false;
  }

  if (pathname.startsWith("/messages")) {
    return false;
  }

  return true;
}
