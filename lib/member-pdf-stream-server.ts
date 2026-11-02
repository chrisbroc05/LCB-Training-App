import "server-only";

import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { canDownloadPaidResourceFile } from "@/lib/resources-access-server";
import { resolveFixItPlanAccessEmail } from "@/lib/fix-it-plan-access-server";
import {
  resolveMemberFixItFileKey,
  resolveMemberGuideAbsolutePath,
  resolveMemberWorkoutAbsolutePath,
} from "@/lib/member-pdf-file-server";
import { resolveFreeResourceDownloadGate, resolvePaidResourceDownloadGate } from "@/lib/resource-download-access-server";
import { getPrivateResourceAbsolutePath } from "@/lib/resource-files-server";
import {
  resolveEvaluationPdfPresignedDownloadUrl,
  resolveEvaluationPdfPresignedInlineUrl,
} from "@/lib/evaluation-pdf-download-server";
import { prisma } from "@/lib/prisma";
import type { MemberPdfOpenTokenPayload } from "@/lib/member-pdf-open-token-shared";

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

export async function streamMemberPdfFromOpenToken(payload: MemberPdfOpenTokenPayload) {
  const download = payload.download;

  if (payload.kind === "guide") {
    const file = payload.file?.trim();
    if (!file) {
      return null;
    }
    const filePath = resolveMemberGuideAbsolutePath(file);
    if (!filePath) {
      return null;
    }
    const fileBuffer = await readFile(filePath);
    return pdfResponse(fileBuffer, file, download);
  }

  if (payload.kind === "workout") {
    const file = payload.file?.trim();
    if (!file) {
      return null;
    }
    const filePath = resolveMemberWorkoutAbsolutePath(file);
    if (!filePath) {
      return null;
    }
    const fileBuffer = await readFile(filePath);
    return pdfResponse(fileBuffer, file, download);
  }

  if (payload.kind === "purchase") {
    const token = payload.purchaseToken?.trim();
    if (!token) {
      return null;
    }
    const freeGate = await resolveFreeResourceDownloadGate(token);
    if (freeGate.kind === "allow") {
      const fileKey = freeGate.payload.fileKey;
      if (!fileKey) {
        return null;
      }
      const filePath = getPrivateResourceAbsolutePath(fileKey);
      const fileBuffer = await readFile(filePath);
      const filename = fileKey.split("/").pop() ?? "resource.pdf";
      return pdfResponse(fileBuffer, filename, download);
    }

    const paidGate = await resolvePaidResourceDownloadGate(token);
    if (paidGate.kind !== "allow") {
      return null;
    }
    const allowed = await canDownloadPaidResourceFile({
      email: paidGate.payload.email,
      userId: payload.uid,
      resourceSlug: paidGate.payload.resourceSlug,
      fileKey: paidGate.payload.fileKey,
      tokenEmailOnly: false,
    });
    if (!allowed) {
      return null;
    }
    const filePath = getPrivateResourceAbsolutePath(paidGate.payload.fileKey);
    const fileBuffer = await readFile(filePath);
    const filename = paidGate.payload.fileKey.split("/").pop() ?? "resource.pdf";
    return pdfResponse(fileBuffer, filename, download);
  }

  if (payload.kind === "evaluation") {
    const submissionId = payload.submissionId?.trim();
    if (!submissionId) {
      return null;
    }
    const user = await prisma.user.findUnique({
      where: { id: payload.uid },
      select: { email: true },
    });
    const resolver = payload.download
      ? resolveEvaluationPdfPresignedDownloadUrl
      : resolveEvaluationPdfPresignedInlineUrl;
    const resolved = await resolver({
      submissionId,
      userId: payload.uid,
      userEmail: user?.email ?? null,
    });
    if (!resolved.ok) {
      return null;
    }
    return NextResponse.redirect(resolved.downloadUrl);
  }

  if (payload.kind === "fixit") {
    const resourceSlug = payload.fixitResource?.trim() ?? "";
    const fileKey = resolveMemberFixItFileKey(resourceSlug);
    if (!fileKey) {
      return null;
    }
    const user = await prisma.user.findUnique({
      where: { id: payload.uid },
      select: { email: true },
    });
    const allowedEmail = await resolveFixItPlanAccessEmail({
      resourceSlug,
      token: payload.fixitToken?.trim() ?? null,
      sessionEmail: user?.email ?? null,
      sessionUserId: payload.uid,
    });
    if (!allowedEmail) {
      return null;
    }
    const filePath = getPrivateResourceAbsolutePath(fileKey);
    const fileBuffer = await readFile(filePath);
    const filename = fileKey.split("/").pop() ?? "fix-it-plan.pdf";
    return pdfResponse(fileBuffer, filename, download);
  }

  return null;
}
