import { createHmac, timingSafeEqual } from "crypto";
import type { MemberPdfViewKind } from "@/lib/my-resources-shared";

/** Short-lived token for opening PDFs in the native viewer (10 minutes). */
export const MEMBER_PDF_OPEN_TTL_MS = 10 * 60 * 1000;

export type MemberPdfOpenTokenPayload = {
  v: 1;
  uid: string;
  kind: MemberPdfViewKind;
  file?: string;
  purchaseToken?: string;
  fixitResource?: string;
  fixitToken?: string;
  submissionId?: string;
  download: boolean;
  exp: number;
};

function getMemberPdfOpenSecret() {
  return (
    process.env.NEXTAUTH_SECRET ??
    process.env.CRON_SECRET ??
    "lcb-training-dev-member-pdf-open"
  );
}

function signBody(body: string) {
  return createHmac("sha256", getMemberPdfOpenSecret()).update(body).digest("hex");
}

export function createMemberPdfOpenToken(payload: Omit<MemberPdfOpenTokenPayload, "v" | "exp">) {
  const exp = Date.now() + MEMBER_PDF_OPEN_TTL_MS;
  const core: MemberPdfOpenTokenPayload = { v: 1, ...payload, exp };
  const body = JSON.stringify(core);
  const signature = signBody(body);
  return Buffer.from(`${body}.${signature}`).toString("base64url");
}

export function verifyMemberPdfOpenToken(token: string): MemberPdfOpenTokenPayload | null {
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
    const expectedSignature = signBody(body);
    const provided = Buffer.from(providedSignature);
    const expected = Buffer.from(expectedSignature);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return null;
    }
    const parsed = JSON.parse(body) as MemberPdfOpenTokenPayload;
    if (parsed.v !== 1 || !parsed.uid || !parsed.kind || !Number.isFinite(parsed.exp)) {
      return null;
    }
    if (Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
