import { createHmac, timingSafeEqual } from "crypto";
import { getPublicAppUrl } from "@/lib/email-layout";

function getParentMessagesTokenSecret() {
  return process.env.CRON_SECRET ?? process.env.NEXTAUTH_SECRET ?? "lcb-training-dev-parent-token";
}

function signParentMessagesTokenPayload(enrollmentId: string) {
  return createHmac("sha256", getParentMessagesTokenSecret()).update(enrollmentId).digest("hex");
}

export function buildParentMessagesToken(enrollmentId: string) {
  const signature = signParentMessagesTokenPayload(enrollmentId);
  return Buffer.from(`${enrollmentId}.${signature}`).toString("base64url");
}

export function verifyParentMessagesToken(token: string) {
  if (!token) {
    return null;
  }

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const separatorIndex = decoded.indexOf(".");
    if (separatorIndex <= 0) {
      return null;
    }

    const enrollmentId = decoded.slice(0, separatorIndex);
    const providedSignature = decoded.slice(separatorIndex + 1);
    if (!enrollmentId || !providedSignature) {
      return null;
    }

    const expectedSignature = signParentMessagesTokenPayload(enrollmentId);
    const provided = Buffer.from(providedSignature);
    const expected = Buffer.from(expectedSignature);

    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return null;
    }

    return enrollmentId;
  } catch {
    return null;
  }
}

export function buildParentMessagesUrl(enrollmentId: string) {
  const token = buildParentMessagesToken(enrollmentId);
  return `${getPublicAppUrl()}/messages/parent?token=${encodeURIComponent(token)}`;
}
