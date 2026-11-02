import "server-only";

import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import {
  resolveEvaluationPdfPresignedDownloadUrl,
  resolveEvaluationPdfPresignedInlineUrl,
} from "@/lib/evaluation-pdf-download-server";
import { resolveFixItPlanAccessEmail } from "@/lib/fix-it-plan-access-server";
import { resolveMemberFixItPrivateFileKey } from "@/lib/member-pdf-file-shared";
import {
  resolveMemberGuideAbsolutePath,
  resolveMemberWorkoutAbsolutePath,
} from "@/lib/member-pdf-file-server";
import type { MemberPdfHandoffParams } from "@/lib/member-pdf-route-params-shared";
import type { MemberPdfUnavailableCode } from "@/lib/member-pdf-unavailable-shared";
import { canDownloadPaidResourceFile } from "@/lib/resources-access-server";
import { resolveFreeResourceDownloadGate, resolvePaidResourceDownloadGate } from "@/lib/resource-download-access-server";
import { getPrivateResourceAbsolutePath } from "@/lib/resource-files-server";
function pdfResponse(buffer: Buffer, filename: string, download: boolean) {
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "private, no-store",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
    },
  });
}

type DeliverResult =
  | { ok: true; response: NextResponse }
  | { ok: false; code: MemberPdfUnavailableCode };

export async function deliverMemberPdf(
  params: MemberPdfHandoffParams & { userId: string; email: string },
): Promise<DeliverResult> {
  const download = params.download;

  if (params.kind === "guide") {
    const file = params.file?.trim();
    if (!file) {
      return { ok: false as const, code: "invalid" as const };
    }
    const filePath = resolveMemberGuideAbsolutePath(file);
    if (!filePath) {
      return { ok: false as const, code: "missing" as const };
    }
    try {
      const fileBuffer = await readFile(filePath);
      return { ok: true as const, response: pdfResponse(fileBuffer, file, download) };
    } catch {
      return { ok: false as const, code: "missing" as const };
    }
  }

  if (params.kind === "workout") {
    const file = params.file?.trim();
    if (!file) {
      return { ok: false as const, code: "invalid" as const };
    }
    const filePath = resolveMemberWorkoutAbsolutePath(file);
    if (!filePath) {
      return { ok: false as const, code: "missing" as const };
    }
    try {
      const fileBuffer = await readFile(filePath);
      return { ok: true as const, response: pdfResponse(fileBuffer, file, download) };
    } catch {
      return { ok: false as const, code: "missing" as const };
    }
  }

  if (params.kind === "evaluation") {
    const submissionId = params.submissionId?.trim();
    if (!submissionId) {
      return { ok: false as const, code: "invalid" as const };
    }
    const resolver = download
      ? resolveEvaluationPdfPresignedDownloadUrl
      : resolveEvaluationPdfPresignedInlineUrl;
    const resolved = await resolver({
      submissionId,
      userId: params.userId,
      userEmail: params.email,
    });
    if (!resolved.ok) {
      const code: MemberPdfUnavailableCode =
        resolved.status === 403 ? "forbidden" : "missing";
      return { ok: false as const, code };
    }
    return { ok: true as const, response: NextResponse.redirect(resolved.downloadUrl) };
  }

  if (params.kind === "fixit") {
    const resourceSlug = params.resource?.trim() ?? "";
    const fileKey = resolveMemberFixItPrivateFileKey(resourceSlug);
    if (!fileKey) {
      return { ok: false as const, code: "invalid" as const };
    }
    const allowedEmail = await resolveFixItPlanAccessEmail({
      resourceSlug,
      token: params.fixitToken?.trim() ?? null,
      sessionEmail: params.email,
      sessionUserId: params.userId,
    });
    if (!allowedEmail) {
      return { ok: false as const, code: "forbidden" as const };
    }
    try {
      const fileBuffer = await readFile(getPrivateResourceAbsolutePath(fileKey));
      const filename = fileKey.split("/").pop() ?? "fix-it-plan.pdf";
      return { ok: true as const, response: pdfResponse(fileBuffer, filename, download) };
    } catch {
      return { ok: false as const, code: "missing" as const };
    }
  }

  if (params.kind === "purchase") {
    const token = params.token?.trim();
    if (!token) {
      return { ok: false as const, code: "invalid" as const };
    }
    const freeGate = await resolveFreeResourceDownloadGate(token);
    if (freeGate.kind === "allow") {
      const fileKey = freeGate.payload.fileKey;
      if (!fileKey) {
        return { ok: false as const, code: "missing" as const };
      }
      try {
        const fileBuffer = await readFile(getPrivateResourceAbsolutePath(fileKey));
        const filename = fileKey.split("/").pop() ?? "resource.pdf";
        return { ok: true as const, response: pdfResponse(fileBuffer, filename, download) };
      } catch {
        return { ok: false as const, code: "missing" as const };
      }
    }

    const paidGate = await resolvePaidResourceDownloadGate(token);
    if (paidGate.kind !== "allow") {
      return { ok: false as const, code: "forbidden" as const };
    }
    const allowed = await canDownloadPaidResourceFile({
      email: paidGate.payload.email,
      userId: params.userId,
      resourceSlug: paidGate.payload.resourceSlug,
      fileKey: paidGate.payload.fileKey,
      tokenEmailOnly: false,
    });
    if (!allowed) {
      return { ok: false as const, code: "forbidden" as const };
    }
    try {
      const fileBuffer = await readFile(getPrivateResourceAbsolutePath(paidGate.payload.fileKey));
      const filename = paidGate.payload.fileKey.split("/").pop() ?? "resource.pdf";
      return { ok: true as const, response: pdfResponse(fileBuffer, filename, download) };
    } catch {
      return { ok: false as const, code: "missing" as const };
    }
  }

  return { ok: false as const, code: "invalid" as const };
}
