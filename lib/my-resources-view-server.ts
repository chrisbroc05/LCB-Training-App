import "server-only";

import { isAdminEmail } from "@/lib/admin";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import { canDownloadWorkoutPdfs } from "@/lib/access-shared";
import { emptyAccessUserRow } from "@/lib/empty-access-user-shared";
import type { MemberPdfViewKind } from "@/lib/my-resources-shared";
import { resolveFixItPdfDownloadGate } from "@/lib/fix-it-plan-access-server";
import { isFixItResourceSlug } from "@/lib/fix-it-plans-shared";
import {
  resolveFreeResourceDownloadGate,
  resolvePaidResourceDownloadGate,
} from "@/lib/resource-download-access-server";
import { peekResourceDownloadToken } from "@/lib/resource-download-token";
import { canDownloadPaidResourceFile } from "@/lib/resources-access-server";
import { getResourceDefinition } from "@/lib/resources-shared";
import { canAccessWorkoutResourceFile, getWorkoutResource } from "@/lib/workout-resources";
import { prisma } from "@/lib/prisma";

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

export type ResolvedPdfViewer = {
  title: string;
  pdfSrc: string;
  downloadHref: string;
};

export async function resolvePdfViewerForSession(params: {
  userId: string;
  email: string;
  isAdmin: boolean;
  kind: MemberPdfViewKind;
  file?: string | null;
  token?: string | null;
  resource?: string | null;
  fixitToken?: string | null;
}): Promise<ResolvedPdfViewer | null> {
  if (params.kind === "workout") {
    const file = params.file?.trim();
    if (!file || !WORKOUT_PDF_NAMES.has(file)) {
      return null;
    }
    if (!params.isAdmin) {
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: userAccessSelect,
      });
      const access = user ? toAccessUserFields(user) : toAccessUserFields(emptyAccessUserRow);
      if (!canDownloadWorkoutPdfs(access)) {
        return null;
      }
    }
    return {
      title: file.replace(/^LCB_/, "").replace(/\.pdf$/, "").replace(/_/g, " "),
      pdfSrc: `/api/workouts/${encodeURIComponent(file)}`,
      downloadHref: `/api/workouts/${encodeURIComponent(file)}?download=1`,
    };
  }

  if (params.kind === "guide") {
    const file = params.file?.trim();
    if (!file || !getWorkoutResource(file)) {
      return null;
    }
    if (!params.isAdmin) {
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: userAccessSelect,
      });
      const access = user ? toAccessUserFields(user) : toAccessUserFields(emptyAccessUserRow);
      if (!canAccessWorkoutResourceFile(access, file)) {
        return null;
      }
    }
    const resource = getWorkoutResource(file);
    return {
      title: resource?.title ?? file,
      pdfSrc: `/api/workout-resources/${encodeURIComponent(file)}`,
      downloadHref: `/api/workout-resources/${encodeURIComponent(file)}?download=1`,
    };
  }

  if (params.kind === "purchase") {
    const token = params.token?.trim();
    if (!token) {
      return null;
    }
    const peek = peekResourceDownloadToken(token);
    const resourceSlug = peek?.resourceSlug;
    const resource = resourceSlug ? getResourceDefinition(resourceSlug) : null;

    if (resource?.type === "FREE_DOWNLOAD") {
      const gate = await resolveFreeResourceDownloadGate(token);
      if (gate.kind !== "allow") {
        return null;
      }
      return {
        title: getResourceDefinition(gate.resourceSlug ?? resourceSlug ?? "")?.title ?? "Resource",
        pdfSrc: `/api/resources/download?token=${encodeURIComponent(token)}&inline=1`,
        downloadHref: `/api/resources/download?token=${encodeURIComponent(token)}&download=1`,
      };
    }

    const paidGate = await resolvePaidResourceDownloadGate(token);
    if (paidGate.kind !== "allow") {
      return null;
    }

    const allowed = await canDownloadPaidResourceFile({
      email: paidGate.payload.email,
      userId: params.userId,
      resourceSlug: paidGate.payload.resourceSlug,
      fileKey: paidGate.payload.fileKey,
      tokenEmailOnly: false,
    });
    if (!allowed && !params.isAdmin) {
      return null;
    }

    return {
      title: getResourceDefinition(paidGate.payload.resourceSlug)?.title ?? "Download",
      pdfSrc: `/api/resources/download?token=${encodeURIComponent(token)}&inline=1`,
      downloadHref: `/api/resources/download?token=${encodeURIComponent(token)}&download=1`,
    };
  }

  if (params.kind === "fixit") {
    const resourceSlug = params.resource?.trim() ?? "";
    if (!isFixItResourceSlug(resourceSlug)) {
      return null;
    }
    const gate = await resolveFixItPdfDownloadGate({
      resourceSlug,
      token: params.fixitToken?.trim() ?? null,
    });
    if (gate.kind !== "allow") {
      return null;
    }
    const tokenQuery = params.fixitToken
      ? `&token=${encodeURIComponent(params.fixitToken)}`
      : "";
    return {
      title: "Fix-It Plan PDF",
      pdfSrc: `/api/fix-it/download?resource=${encodeURIComponent(resourceSlug)}${tokenQuery}&inline=1`,
      downloadHref: `/api/fix-it/download?resource=${encodeURIComponent(resourceSlug)}${tokenQuery}&download=1`,
    };
  }

  return null;
}

export function sessionIsAdmin(email: string | null | undefined) {
  return isAdminEmail(email);
}
