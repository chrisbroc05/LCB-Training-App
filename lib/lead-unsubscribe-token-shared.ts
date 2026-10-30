import { createHmac } from "crypto";

import { getPublicAppUrl } from "@/lib/public-app-url";

const LEAD_UNSUBSCRIBE_TTL_SECONDS = 60 * 60 * 24 * 365 * 5;

function getLeadUnsubscribeSecret() {
  return process.env.NEXTAUTH_SECRET ?? "lcb-training-dev-lead-unsubscribe";
}

function signLeadUnsubscribeEncoded(encoded: string) {
  return createHmac("sha256", getLeadUnsubscribeSecret()).update(encoded).digest("base64url");
}

export function buildLeadUnsubscribeUrl(leadId: string) {
  const exp = Math.floor(Date.now() / 1000) + LEAD_UNSUBSCRIBE_TTL_SECONDS;
  const encoded = encodeLeadUnsubscribePayload({ leadId, exp });
  const signature = signLeadUnsubscribeEncoded(encoded);
  const token = `${encoded}.${signature}`;
  return `${getPublicAppUrl()}/leads/unsubscribe?token=${encodeURIComponent(token)}`;
}

export type LeadUnsubscribeTokenPayload = {
  leadId: string;
  exp: number;
};

export function encodeLeadUnsubscribePayload(payload: LeadUnsubscribeTokenPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeLeadUnsubscribePayload(encoded: string): LeadUnsubscribeTokenPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as LeadUnsubscribeTokenPayload;
    if (!parsed?.leadId || typeof parsed.exp !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
