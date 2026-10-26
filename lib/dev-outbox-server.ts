import "server-only";

import { randomUUID } from "crypto";
import type {
  DevOutboxEmailEntry,
  DevOutboxPushEntry,
  DevOutboxSnapshot,
} from "@/lib/dev-outbox-shared";

const MAX_ENTRIES = 200;

type GlobalDevOutbox = {
  emails: DevOutboxEmailEntry[];
  pushes: DevOutboxPushEntry[];
};

const globalStore = globalThis as typeof globalThis & { __lcbDevOutbox?: GlobalDevOutbox };

function store(): GlobalDevOutbox {
  if (!globalStore.__lcbDevOutbox) {
    globalStore.__lcbDevOutbox = { emails: [], pushes: [] };
  }
  return globalStore.__lcbDevOutbox;
}

export function shouldCaptureOutboundInDev(): boolean {
  return process.env.NODE_ENV === "development";
}

function normalizeRecipients(to: unknown): string {
  if (Array.isArray(to)) {
    return to.map(String).join(", ");
  }
  if (to && typeof to === "object" && "address" in to) {
    return String((to as { address: string }).address);
  }
  return String(to ?? "");
}

export function recordDevOutboxEmail(options: {
  to?: unknown;
  subject?: string;
  text?: string;
  html?: string;
}) {
  const entry: DevOutboxEmailEntry = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    to: normalizeRecipients(options.to),
    subject: options.subject ?? "(no subject)",
    text: options.text,
    html: options.html,
  };

  const bucket = store();
  bucket.emails.unshift(entry);
  if (bucket.emails.length > MAX_ENTRIES) {
    bucket.emails.length = MAX_ENTRIES;
  }
}

export function recordDevOutboxPush(options: {
  userId: string;
  title: string;
  body: string;
  url?: string;
}) {
  const entry: DevOutboxPushEntry = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    userId: options.userId,
    title: options.title,
    body: options.body,
    url: options.url,
  };

  const bucket = store();
  bucket.pushes.unshift(entry);
  if (bucket.pushes.length > MAX_ENTRIES) {
    bucket.pushes.length = MAX_ENTRIES;
  }
}

export function getDevOutboxSnapshot(): DevOutboxSnapshot {
  const bucket = store();
  return {
    emails: [...bucket.emails],
    pushes: [...bucket.pushes],
  };
}

export function clearDevOutbox() {
  const bucket = store();
  bucket.emails.length = 0;
  bucket.pushes.length = 0;
}
