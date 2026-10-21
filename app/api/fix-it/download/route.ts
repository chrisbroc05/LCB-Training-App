import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { resolveFixItPdfDownloadGate } from "@/lib/fix-it-plan-access-server";
import { getFixItPdfFileKey, isFixItResourceSlug } from "@/lib/fix-it-plans-shared";
import { buildAppRedirectUrl } from "@/lib/request-base-url-shared";
import { getPrivateResourceAbsolutePath } from "@/lib/resource-files-server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const resourceSlug = url.searchParams.get("resource")?.trim() ?? "";
  const token = url.searchParams.get("token")?.trim() ?? null;

  if (!isFixItResourceSlug(resourceSlug)) {
    return NextResponse.redirect(buildAppRedirectUrl(request, "/resources/download/recover"));
  }

  const gate = await resolveFixItPdfDownloadGate({ resourceSlug, token });
  if (gate.kind === "refunded") {
    return NextResponse.redirect(
      buildAppRedirectUrl(request, "/resources/download/refunded", { resource: resourceSlug }),
    );
  }
  if (gate.kind !== "allow") {
    return NextResponse.redirect(
      buildAppRedirectUrl(request, "/resources/download/recover", { resource: resourceSlug }),
    );
  }

  const fileKey = getFixItPdfFileKey(resourceSlug);
  if (!fileKey) {
    return NextResponse.redirect(
      buildAppRedirectUrl(request, "/resources/download/recover", { resource: resourceSlug }),
    );
  }

  const filePath = getPrivateResourceAbsolutePath(fileKey);
  let fileBuffer: Buffer;
  try {
    fileBuffer = await readFile(filePath);
  } catch {
    return NextResponse.redirect(
      buildAppRedirectUrl(request, "/resources/download/recover", { resource: resourceSlug }),
    );
  }

  const filename = fileKey.split("/").pop() ?? "fix-it-plan.pdf";
  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
