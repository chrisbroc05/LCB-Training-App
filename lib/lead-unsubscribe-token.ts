import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import {
  buildLeadUnsubscribeUrl,
  decodeLeadUnsubscribePayload,
} from "@/lib/lead-unsubscribe-token-shared";

export { buildLeadUnsubscribeUrl };

function getLeadUnsubscribeSecret() {
  return process.env.NEXTAUTH_SECRET ?? "lcb-training-dev-lead-unsubscribe";
}

function sign(encoded: string) {
  return createHmac("sha256", getLeadUnsubscribeSecret()).update(encoded).digest("base64url");
}

export function verifyLeadUnsubscribeToken(token: string) {
  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex <= 0) {
    return null;
  }

  const encoded = token.slice(0, separatorIndex);
  const providedSignature = token.slice(separatorIndex + 1);
  const expectedSignature = sign(encoded);
  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  const payload = decodeLeadUnsubscribePayload(encoded);
  if (!payload || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload.leadId;
}
