import { createHmac, timingSafeEqual } from "crypto";
import { getPublicAppUrl } from "@/lib/email-layout";

function getParentTokenSecret() {
  return process.env.CRON_SECRET ?? process.env.NEXTAUTH_SECRET ?? "lcb-training-dev-parent-token";
}

function signParentTokenPayload(enrollmentId: string) {
  return createHmac("sha256", getParentTokenSecret()).update(enrollmentId).digest("hex");
}

export function buildParentUnsubscribeToken(enrollmentId: string) {
  const signature = signParentTokenPayload(enrollmentId);
  return Buffer.from(`${enrollmentId}.${signature}`).toString("base64url");
}

export function verifyParentUnsubscribeToken(token: string) {
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

    const expectedSignature = signParentTokenPayload(enrollmentId);
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

export function buildParentUnsubscribeUrl(enrollmentId: string) {
  const token = buildParentUnsubscribeToken(enrollmentId);
  return `${getPublicAppUrl()}/program/parent/unsubscribe?token=${encodeURIComponent(token)}`;
}
