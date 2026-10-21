import { createHmac, timingSafeEqual } from "crypto";
import {
  decodeFixItPlanAccessTokenPayload,
  encodeFixItPlanAccessTokenPayload,
  type FixItPlanAccessTokenPayload,
} from "@/lib/fix-it-plan-access-token-shared";

function getFixItPlanAccessSecret() {
  return process.env.NEXTAUTH_SECRET ?? "lcb-training-dev-fix-it-plan-access";
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getFixItPlanAccessSecret()).update(encodedPayload).digest("base64url");
}

export function createFixItPlanAccessToken(params: { email: string; resourceSlug: string }) {
  const payload: FixItPlanAccessTokenPayload = {
    email: params.email.trim().toLowerCase(),
    resourceSlug: params.resourceSlug.trim(),
  };
  const encoded = encodeFixItPlanAccessTokenPayload(payload);
  const signature = signPayload(encoded);
  return `${encoded}.${signature}`;
}

export function verifyFixItPlanAccessToken(token: string): FixItPlanAccessTokenPayload | null {
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

  return decodeFixItPlanAccessTokenPayload(encoded);
}
