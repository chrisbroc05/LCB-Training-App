import { createHmac, timingSafeEqual } from "crypto";
import { getPublicAppUrl } from "@/lib/email-layout";

function getMarketingTokenSecret() {
  return process.env.CRON_SECRET ?? process.env.NEXTAUTH_SECRET ?? "lcb-training-dev-marketing-token";
}

function signMarketingTokenPayload(userId: string) {
  return createHmac("sha256", getMarketingTokenSecret()).update(userId).digest("hex");
}

export function buildMarketingUnsubscribeToken(userId: string) {
  const signature = signMarketingTokenPayload(userId);
  return Buffer.from(`${userId}.${signature}`).toString("base64url");
}

export function verifyMarketingUnsubscribeToken(token: string) {
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

    const expectedSignature = signMarketingTokenPayload(userId);
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

export function buildMarketingUnsubscribeUrl(userId: string) {
  const token = buildMarketingUnsubscribeToken(userId);
  return `${getPublicAppUrl()}/marketing/unsubscribe?token=${encodeURIComponent(token)}`;
}
