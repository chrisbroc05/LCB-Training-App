import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  canDownloadFreeResourceLead,
  canDownloadPaidResourceFile,
} from "@/lib/resources-access-server";
import { getResourceDefinition } from "@/lib/resources-shared";
import { getPrivateResourceAbsolutePath } from "@/lib/resource-files-server";
import { verifyResourceDownloadToken } from "@/lib/resource-download-token";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json({ error: "Missing download token." }, { status: 400 });
  }

  const payload = verifyResourceDownloadToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired download link." }, { status: 403 });
  }

  const resource = getResourceDefinition(payload.resourceSlug);
  if (!resource) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const sessionEmail = session?.user?.email?.toLowerCase() ?? null;

  if (
    sessionEmail &&
    sessionEmail !== payload.email.toLowerCase() &&
    resource.type === "PAID_DOWNLOAD"
  ) {
    return NextResponse.json({ error: "Download link does not match signed-in account." }, { status: 403 });
  }

  let allowed = false;
  if (resource.type === "FREE_DOWNLOAD") {
    allowed = await canDownloadFreeResourceLead({
      email: payload.email,
      resourceSlug: payload.resourceSlug,
      fileKey: payload.fileKey,
    });
  } else if (resource.type === "PAID_DOWNLOAD") {
    allowed = await canDownloadPaidResourceFile({
      email: payload.email,
      userId,
      resourceSlug: payload.resourceSlug,
      fileKey: payload.fileKey,
    });
  }

  if (!allowed) {
    return NextResponse.json({ error: "Download not authorized." }, { status: 403 });
  }

  const filePath = getPrivateResourceAbsolutePath(payload.fileKey);
  let fileBuffer: Buffer;
  try {
    fileBuffer = await readFile(filePath);
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const filename = payload.fileKey.split("/").pop() ?? "download.pdf";
  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
