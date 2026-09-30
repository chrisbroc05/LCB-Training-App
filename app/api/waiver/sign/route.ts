import { jsonNoStore } from "@/lib/api-no-store";
import { parseWaiverSignPayload, type WaiverSignFormValues } from "@/lib/waiver-sign-shared";
import { sendWaiverConfirmationEmail } from "@/lib/waiver-sign-email";
import { sendCoachWaiverSignedPush } from "@/lib/waiver-sign-notifications";
import {
  applyMatchingWaiverAcceptanceToUser,
  createWaiverSignature,
  getRequestIp,
  isWaiverSignRateLimited,
} from "@/lib/waiver-sign-server";

export { dynamic, revalidate } from "@/lib/api-no-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | (WaiverSignFormValues & { teamLocked?: boolean })
      | null;

    if (!body) {
      return jsonNoStore({ error: "Invalid request." }, { status: 400 });
    }

    const teamLocked = Boolean(body.teamLocked);
    const parsed = parseWaiverSignPayload(body, teamLocked);

    if (!parsed.ok) {
      return jsonNoStore({ error: parsed.error }, { status: 400 });
    }

    if (parsed.honeypot) {
      return jsonNoStore({ success: true });
    }

    const ip = getRequestIp(request);
    if (await isWaiverSignRateLimited(ip)) {
      return jsonNoStore(
        { error: "Too many submissions from this connection. Try again later." },
        { status: 429 },
      );
    }

    const signature = await createWaiverSignature({
      ...parsed.data,
      ip,
    });

    if (signature.userId) {
      await applyMatchingWaiverAcceptanceToUser(signature.userId);
    }

    try {
      await sendWaiverConfirmationEmail({
        to: signature.signerEmail,
        playerFirstName: signature.playerFirstName,
        playerLastName: signature.playerLastName,
        signedAt: signature.signedAt,
        version: signature.version,
      });
    } catch (error) {
      console.error("Failed to send waiver confirmation email", error);
    }

    try {
      await sendCoachWaiverSignedPush({
        signatureId: signature.id,
        playerFirstName: signature.playerFirstName,
        playerLastName: signature.playerLastName,
        teamName: signature.teamName,
        signupType: signature.signupType,
      });
    } catch (error) {
      console.error("Failed to send waiver signed coach push", error);
    }

    return jsonNoStore({
      success: true,
      playerName: `${signature.playerFirstName} ${signature.playerLastName}`.trim(),
    });
  } catch (error) {
    console.error("Failed to save waiver signature", error);
    return jsonNoStore({ error: "Unable to save waiver right now." }, { status: 500 });
  }
}
