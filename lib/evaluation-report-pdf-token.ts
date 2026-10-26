import { createHmac, timingSafeEqual } from "crypto";
import { getPublicAppUrl } from "@/lib/public-app-url";

/** Long-lived email links (90 days). */
const TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

function getEvaluationReportPdfTokenSecret() {
  return (
    process.env.CRON_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "lcb-training-dev-evaluation-pdf-token"
  );
}

function signPayload(payload: string) {
  return createHmac("sha256", getEvaluationReportPdfTokenSecret()).update(payload).digest("hex");
}

export function buildEvaluationReportPdfDownloadToken(submissionId: string, userId: string) {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const body = `${submissionId}.${userId}.${expiresAt}`;
  const signature = signPayload(body);
  return Buffer.from(`${body}.${signature}`).toString("base64url");
}

export function verifyEvaluationReportPdfDownloadToken(token: string) {
  if (!token.trim()) {
    return null;
  }

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastDot = decoded.lastIndexOf(".");
    if (lastDot <= 0) {
      return null;
    }

    const body = decoded.slice(0, lastDot);
    const providedSignature = decoded.slice(lastDot + 1);
    const parts = body.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [submissionId, userId, expiresAtRaw] = parts;
    const expiresAt = Number(expiresAtRaw);
    if (!submissionId || !userId || !Number.isFinite(expiresAt)) {
      return null;
    }

    if (Date.now() > expiresAt) {
      return null;
    }

    const expectedSignature = signPayload(body);
    const provided = Buffer.from(providedSignature);
    const expected = Buffer.from(expectedSignature);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return null;
    }

    return { submissionId, userId };
  } catch {
    return null;
  }
}

export function buildEvaluationReportPdfEmailUrl(submissionId: string, userId: string) {
  const token = buildEvaluationReportPdfDownloadToken(submissionId, userId);
  return `${getPublicAppUrl()}/reports/${submissionId}/pdf?token=${encodeURIComponent(token)}`;
}
