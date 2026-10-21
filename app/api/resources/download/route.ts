import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { buildAppRedirectUrl } from "@/lib/request-base-url-shared";
import {
  resolveFreeResourceDownloadGate,
  resolvePaidResourceDownloadGate,
} from "@/lib/resource-download-access-server";
import { peekResourceDownloadToken } from "@/lib/resource-download-token";
import { canDownloadPaidResourceFile } from "@/lib/resources-access-server";
import { getResourceDefinition } from "@/lib/resources-shared";
import { getPrivateResourceAbsolutePath } from "@/lib/resource-files-server";

function redirectDownloadError(
  request: Request,
  kind: "refunded" | "invalid" | "not_authorized",
  resourceSlug?: string,
) {
  if (kind === "refunded") {
    return NextResponse.redirect(
      buildAppRedirectUrl(request, "/resources/download/refunded", resourceSlug ? { resource: resourceSlug } : undefined),
    );
  }
  return NextResponse.redirect(
    buildAppRedirectUrl(request, "/resources/download/recover", resourceSlug ? { resource: resourceSlug } : undefined),
  );
}

async function serveFile(request: Request, fileKey: string) {
  const filePath = getPrivateResourceAbsolutePath(fileKey);
  let fileBuffer: Buffer;
  try {
    fileBuffer = await readFile(filePath);
  } catch {
    return redirectDownloadError(request, "invalid");
  }

  const filename = fileKey.split("/").pop() ?? "download.pdf";
  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();

  if (!token) {
    return redirectDownloadError(request, "invalid");
  }

  const peek = peekResourceDownloadToken(token);
  const resourceSlug = peek?.resourceSlug;
  const resource = resourceSlug ? getResourceDefinition(resourceSlug) : null;

  if (resource?.type === "FREE_DOWNLOAD") {
    const gate = await resolveFreeResourceDownloadGate(token);
    if (gate.kind !== "allow") {
      return redirectDownloadError(request, "invalid", gate.resourceSlug);
    }
    return serveFile(request, gate.payload.fileKey);
  }

  const paidGate = await resolvePaidResourceDownloadGate(token);
  if (paidGate.kind === "refunded") {
    return redirectDownloadError(request, "refunded", paidGate.resourceSlug);
  }
  if (paidGate.kind !== "allow") {
    return redirectDownloadError(request, "invalid", paidGate.resourceSlug);
  }

  const { payload } = paidGate;
  const paidResource = getResourceDefinition(payload.resourceSlug);
  if (!paidResource || paidResource.type !== "PAID_DOWNLOAD") {
    return redirectDownloadError(request, "invalid", payload.resourceSlug);
  }

  const allowed = await canDownloadPaidResourceFile({
    email: payload.email,
    resourceSlug: payload.resourceSlug,
    fileKey: payload.fileKey,
    tokenEmailOnly: true,
  });

  if (!allowed) {
    return redirectDownloadError(request, "not_authorized", payload.resourceSlug);
  }

  return serveFile(request, payload.fileKey);
}
