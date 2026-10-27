import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { jsonNoStore } from "@/lib/api-no-store";
import { sendWaiverResignLinkEmail } from "@/lib/waiver-resign-email";
import { prisma } from "@/lib/prisma";
import { buildWaiverPlayerFullName } from "@/lib/waiver-sign-shared";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return jsonNoStore({ error: "Forbidden" }, { status: 403 });
  }

  let body: { waiverSignatureId?: string };
  try {
    body = (await request.json()) as { waiverSignatureId?: string };
  } catch {
    return jsonNoStore({ error: "Invalid JSON" }, { status: 400 });
  }

  const waiverSignatureId = body.waiverSignatureId?.trim();
  if (!waiverSignatureId) {
    return jsonNoStore({ error: "waiverSignatureId is required." }, { status: 400 });
  }

  const signature = await prisma.waiverSignature.findUnique({
    where: { id: waiverSignatureId },
    select: {
      id: true,
      playerFirstName: true,
      playerLastName: true,
      signerFullName: true,
      signerEmail: true,
      teamName: true,
    },
  });

  if (!signature) {
    return jsonNoStore({ error: "Waiver signature not found." }, { status: 404 });
  }

  try {
    await sendWaiverResignLinkEmail({
      toEmail: signature.signerEmail,
      signerName: signature.signerFullName,
      playerName: buildWaiverPlayerFullName(signature.playerFirstName, signature.playerLastName),
      teamName: signature.teamName,
    });
  } catch (error) {
    console.error("sendWaiverResignLinkEmail failed", error);
    return jsonNoStore({ error: "Unable to send email right now." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
