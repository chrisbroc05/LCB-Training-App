import "server-only";

import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { canDownloadPaidResourceFile } from "@/lib/resources-access-server";
import { resolveFixItPlanAccessEmail } from "@/lib/fix-it-plan-access-server";
import { getFixItPdfFileKey, isFixItResourceSlug } from "@/lib/fix-it-plans-shared";
import { resolveFreeResourceDownloadGate, resolvePaidResourceDownloadGate } from "@/lib/resource-download-access-server";
import { getResourceDefinition } from "@/lib/resources-shared";
import { getPrivateResourceAbsolutePath } from "@/lib/resource-files-server";
import { getWorkoutResource } from "@/lib/workout-resources";
import {
  resolveEvaluationPdfPresignedDownloadUrl,
  resolveEvaluationPdfPresignedInlineUrl,
} from "@/lib/evaluation-pdf-download-server";
import { prisma } from "@/lib/prisma";
import type { MemberPdfOpenTokenPayload } from "@/lib/member-pdf-open-token-shared";

const WORKOUT_PDF_NAMES = new Set([
  "LCB_Strength_8-11_Phase1.pdf",
  "LCB_Strength_8-11_Phase2.pdf",
  "LCB_Strength_8-11_Phase3.pdf",
  "LCB_Strength_12-15_Phase1.pdf",
  "LCB_Strength_12-15_Phase2.pdf",
  "LCB_Strength_12-15_Phase3.pdf",
  "LCB_Strength_16-18_Phase1.pdf",
  "LCB_Strength_16-18_Phase2.pdf",
  "LCB_Strength_16-18_Phase3.pdf",
  "LCB_Speed-Agility_8-11_Phase1.pdf",
  "LCB_Speed-Agility_8-11_Phase2.pdf",
  "LCB_Speed-Agility_8-11_Phase3.pdf",
  "LCB_Speed-Agility_12-15_Phase1.pdf",
  "LCB_Speed-Agility_12-15_Phase2.pdf",
  "LCB_Speed-Agility_12-15_Phase3.pdf",
  "LCB_Speed-Agility_16-18_Phase1.pdf",
  "LCB_Speed-Agility_16-18_Phase2.pdf",
  "LCB_Speed-Agility_16-18_Phase3.pdf",
  "LCB_Mobility_8-11.pdf",
  "LCB_Mobility_12-15.pdf",
  "LCB_Mobility_16-18.pdf",
]);

function getWorkoutPdfPath(filename: string) {
  const privatePath = path.join(process.cwd(), "private", "workouts", filename);
  if (existsSync(privatePath)) {
    return privatePath;
  }
  return path.join(process.cwd(), "public", "workouts", filename);
}

function getGuidePdfPath(filename: string) {
  const resource = getWorkoutResource(filename);
  if (resource?.storageFileKey) {
    return getPrivateResourceAbsolutePath(resource.storageFileKey);
  }
  return getPrivateResourceAbsolutePath(`guides/${filename}`);
}

function pdfResponse(buffer: Buffer, filename: string, download: boolean) {
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
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
    const filePath = getGuidePdfPath(file);
    if (!existsSync(filePath)) {
      return null;
    }
    const fileBuffer = await readFile(filePath);
    return pdfResponse(fileBuffer, file, download);
  }

  if (payload.kind === "workout") {
    const file = payload.file?.trim();
    if (!file || !WORKOUT_PDF_NAMES.has(file)) {
      return null;
    }
    const filePath = getWorkoutPdfPath(file);
    if (!existsSync(filePath)) {
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
    if (!isFixItResourceSlug(resourceSlug)) {
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
    const fileKey = getFixItPdfFileKey(resourceSlug);
    if (!fileKey) {
      return null;
    }
    const filePath = getPrivateResourceAbsolutePath(fileKey);
    const fileBuffer = await readFile(filePath);
    const filename = fileKey.split("/").pop() ?? "fix-it-plan.pdf";
    return pdfResponse(fileBuffer, filename, download);
  }

  return null;
}
