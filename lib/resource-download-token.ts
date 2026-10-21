import { createHmac, timingSafeEqual } from "crypto";
import {
  decodeResourceDownloadTokenPayload,
  encodeResourceDownloadTokenPayload,
  type ResourceDownloadTokenPayload,
} from "@/lib/resource-download-token-shared";

const TOKEN_TTL_SECONDS = 15 * 60;

function getResourceDownloadSecret() {
  return process.env.NEXTAUTH_SECRET ?? "lcb-training-dev-resource-download";
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getResourceDownloadSecret()).update(encodedPayload).digest("base64url");
}

export function createResourceDownloadToken(params: {
  fileKey: string;
  email: string;
  resourceSlug: string;
  ttlSeconds?: number;
}) {
  const exp = Math.floor(Date.now() / 1000) + (params.ttlSeconds ?? TOKEN_TTL_SECONDS);
  const payload: ResourceDownloadTokenPayload = {
    fileKey: params.fileKey,
    email: params.email.toLowerCase(),
    exp,
    resourceSlug: params.resourceSlug,
  };
  const encoded = encodeResourceDownloadTokenPayload(payload);
  const signature = signPayload(encoded);
  return `${encoded}.${signature}`;
}

function verifyResourceDownloadTokenCore(
  token: string,
  options?: { ignoreExpiration?: boolean },
): ResourceDownloadTokenPayload | null {
  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex <= 0) {
    return null;
  }

  const encoded = token.slice(0, separatorIndex);
  const providedSignature = token.slice(separatorIndex + 1);
  const expectedSignature = signPayload(encoded);

  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  const payload = decodeResourceDownloadTokenPayload(encoded);
  if (!payload) {
    return null;
  }

  if (!options?.ignoreExpiration && payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export function verifyResourceDownloadToken(token: string): ResourceDownloadTokenPayload | null {
  return verifyResourceDownloadTokenCore(token);
}

export function peekResourceDownloadToken(token: string): ResourceDownloadTokenPayload | null {
  return verifyResourceDownloadTokenCore(token, { ignoreExpiration: true });
}
