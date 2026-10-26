import { createHmac, timingSafeEqual } from "crypto";
import { getPublicAppUrl } from "@/lib/public-app-url";

/** Email download links (90 days). Each click mints a fresh short-lived download token. */
const TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60;

export type ResourceEmailDownloadGrant =
  | { kind: "purchase"; purchaseId: string; fileKey: string }
  | { kind: "lead"; leadId: string; resourceSlug: string; fileKey: string };

type ResourceEmailDownloadTokenPayload =
  | {
      kind: "purchase";
      purchaseId: string;
      fileKey: string;
      exp: number;
    }
  | {
      kind: "lead";
      leadId: string;
      resourceSlug: string;
      fileKey: string;
      exp: number;
    };

function getResourceEmailDownloadSecret() {
  return (
    process.env.CRON_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "lcb-training-dev-resource-email-download"
  );
}

function signEncoded(encoded: string) {
  return createHmac("sha256", getResourceEmailDownloadSecret()).update(encoded).digest("base64url");
}

function encodePayload(payload: ResourceEmailDownloadTokenPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(encoded: string): ResourceEmailDownloadTokenPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as ResourceEmailDownloadTokenPayload;
    if (!parsed || typeof parsed.exp !== "number") {
      return null;
    }
    if (parsed.kind === "purchase") {
      if (typeof parsed.purchaseId !== "string" || typeof parsed.fileKey !== "string") {
        return null;
      }
      return parsed;
    }
    if (parsed.kind === "lead") {
      if (
        typeof parsed.leadId !== "string" ||
        typeof parsed.resourceSlug !== "string" ||
        typeof parsed.fileKey !== "string"
      ) {
        return null;
      }
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function grantToPayload(grant: ResourceEmailDownloadGrant, exp: number): ResourceEmailDownloadTokenPayload {
  if (grant.kind === "purchase") {
    return {
      kind: "purchase",
      purchaseId: grant.purchaseId,
      fileKey: grant.fileKey,
      exp,
    };
  }
  return {
    kind: "lead",
    leadId: grant.leadId,
    resourceSlug: grant.resourceSlug,
    fileKey: grant.fileKey,
    exp,
  };
}

function payloadToGrant(payload: ResourceEmailDownloadTokenPayload): ResourceEmailDownloadGrant | null {
  if (payload.kind === "purchase") {
    return {
      kind: "purchase",
      purchaseId: payload.purchaseId,
      fileKey: payload.fileKey,
    };
  }
  if (payload.kind === "lead") {
    return {
      kind: "lead",
      leadId: payload.leadId,
      resourceSlug: payload.resourceSlug,
      fileKey: payload.fileKey,
    };
  }
  return null;
}

export function createResourceEmailDownloadToken(grant: ResourceEmailDownloadGrant) {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const encoded = encodePayload(grantToPayload(grant, exp));
  const signature = signEncoded(encoded);
  return `${encoded}.${signature}`;
}

export function verifyResourceEmailDownloadToken(token: string): ResourceEmailDownloadGrant | null {
  if (!token.trim()) {
    return null;
  }

  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex <= 0) {
    return null;
  }

  const encoded = token.slice(0, separatorIndex);
  const providedSignature = token.slice(separatorIndex + 1);
  const expectedSignature = signEncoded(encoded);

  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  const payload = decodePayload(encoded);
  if (!payload || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payloadToGrant(payload);
}

export function buildResourceEmailDownloadUrl(token: string) {
  return `${getPublicAppUrl()}/resources/download/go?token=${encodeURIComponent(token)}`;
}

export function buildPurchaseResourceEmailDownloadUrl(purchaseId: string, fileKey: string) {
  const token = createResourceEmailDownloadToken({ kind: "purchase", purchaseId, fileKey });
  return buildResourceEmailDownloadUrl(token);
}

export function buildLeadResourceEmailDownloadUrl(
  leadId: string,
  resourceSlug: string,
  fileKey: string,
) {
  const token = createResourceEmailDownloadToken({ kind: "lead", leadId, resourceSlug, fileKey });
  return buildResourceEmailDownloadUrl(token);
}
