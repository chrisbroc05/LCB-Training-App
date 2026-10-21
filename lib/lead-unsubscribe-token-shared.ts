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
