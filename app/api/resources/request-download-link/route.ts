import { NextResponse } from "next/server";
import { emailHasActiveResourcePurchase } from "@/lib/fix-it-plan-access-server";
import { PURCHASE_LINK_RECOVERY_CONFIRMATION } from "@/lib/resource-download-access-shared";
import { normalizeLeadEmail } from "@/lib/leads-shared";
import { sendResourceDownloadLinksEmail } from "@/lib/resource-emails-server";
import { getResourceDefinition } from "@/lib/resources-shared";

export async function POST(request: Request) {
  let body: { email?: string; resourceSlug?: string };
  try {
    body = (await request.json()) as { email?: string; resourceSlug?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const resourceSlug = body.resourceSlug?.trim() ?? "";
  const email = normalizeLeadEmail(body.email ?? "");

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }

  const resource = getResourceDefinition(resourceSlug);
  if (!resource || resource.type !== "PAID_DOWNLOAD") {
    return NextResponse.json({ error: "Unknown resource." }, { status: 400 });
  }

  const hasPurchase = await emailHasActiveResourcePurchase(email, resourceSlug);
  if (hasPurchase) {
    try {
      await sendResourceDownloadLinksEmail({ toEmail: email, resourceSlug });
    } catch (err) {
      console.error("sendResourceDownloadLinksEmail failed", err);
    }
  }

  return NextResponse.json({
    ok: true,
    message: PURCHASE_LINK_RECOVERY_CONFIRMATION,
  });
}
