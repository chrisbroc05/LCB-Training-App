import { LEAD_COOKIE_NAME } from "@/lib/resources-lead-shared";
import type { ResourceLeadActionResult } from "@/lib/resources-lead-shared";
import type { LeadRoleValue } from "@/lib/resources-shared";

export function readLeadIdFromCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${LEAD_COOKIE_NAME}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export async function postResourceLeadAction(body: {
  resourceSlug: string;
  firstName?: string;
  email?: string;
  role?: LeadRoleValue;
  leadId?: string;
  playerAge13Plus?: boolean | null;
  parentEmail?: string | null;
}) {
  const response = await fetch("/api/resources/lead-action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as ResourceLeadActionResult & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Unable to continue.");
  }
  return data;
}

export function followResourceLeadAction(result: ResourceLeadActionResult) {
  if (result.action === "download") {
    window.location.href = result.downloadUrl;
    return;
  }
  if (result.action === "checkout" || result.action === "redirect") {
    window.location.href = result.url;
  }
}
