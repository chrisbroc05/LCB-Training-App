import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { assertFixItPlanAccessFromRequest } from "@/lib/fix-it-plan-access-server";
import { getFixItPdfFileKey, isFixItResourceSlug } from "@/lib/fix-it-plans-shared";
import { getPrivateResourceAbsolutePath } from "@/lib/resource-files-server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const resourceSlug = url.searchParams.get("resource")?.trim() ?? "";
  const token = url.searchParams.get("token")?.trim() ?? null;

  if (!isFixItResourceSlug(resourceSlug)) {
    return NextResponse.json({ error: "Invalid resource." }, { status: 400 });
  }

  const email = await assertFixItPlanAccessFromRequest({ resourceSlug, token });
  if (!email) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const fileKey = getFixItPdfFileKey(resourceSlug);
  if (!fileKey) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const filePath = getPrivateResourceAbsolutePath(fileKey);
  let fileBuffer: Buffer;
  try {
    fileBuffer = await readFile(filePath);
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
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
