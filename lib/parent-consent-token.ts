import { createHmac, timingSafeEqual } from "crypto";
import { getPublicAppUrl } from "@/lib/email-layout";

function getParentConsentTokenSecret() {
  return (
    process.env.CRON_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "lcb-training-dev-parent-consent-token"
  );
}

function signParentConsentTokenPayload(userId: string) {
  return createHmac("sha256", getParentConsentTokenSecret()).update(userId).digest("hex");
}

export function buildParentConsentConfirmToken(userId: string) {
  const signature = signParentConsentTokenPayload(userId);
  return Buffer.from(`${userId}.${signature}`).toString("base64url");
}

export function verifyParentConsentConfirmToken(token: string) {
  if (!token) {
    return null;
  }

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const separatorIndex = decoded.indexOf(".");
    if (separatorIndex <= 0) {
      return null;
    }

    const userId = decoded.slice(0, separatorIndex);
    const providedSignature = decoded.slice(separatorIndex + 1);
    if (!userId || !providedSignature) {
      return null;
    }

    const expectedSignature = signParentConsentTokenPayload(userId);
    const provided = Buffer.from(providedSignature);
    const expected = Buffer.from(expectedSignature);

    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return null;
    }

    return userId;
  } catch {
    return null;
  }
}

export function buildParentConsentConfirmUrl(userId: string) {
  const token = buildParentConsentConfirmToken(userId);
  return `${getPublicAppUrl()}/legal/parent-consent?token=${encodeURIComponent(token)}`;
}
