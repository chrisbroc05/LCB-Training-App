import { randomUUID } from "crypto";
import { jsonNoStore } from "@/lib/api-no-store";
import {
  buildWaiverPlayerFullName,
  parseWaiverSignPayload,
  type WaiverSignFormValues,
} from "@/lib/waiver-sign-shared";
import { sendWaiverConfirmationEmail } from "@/lib/waiver-sign-email";
import { sendCoachWaiverSignedPush } from "@/lib/waiver-sign-notifications";
import {
  applyMatchingWaiverAcceptanceToUser,
  createWaiverSignatureBatch,
  findLinkedUserIdForWaiverEmail,
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
      return jsonNoStore({ success: true, playerNames: [] });
    }

    const ip = getRequestIp(request);
    if (await isWaiverSignRateLimited(ip)) {
      return jsonNoStore(
        { error: "Too many submissions from this connection. Try again later." },
        { status: 429 },
      );
    }

    const submissionBatchId = randomUUID();
    const signedAt = new Date();
    const signatures = await createWaiverSignatureBatch({
      shared: parsed.shared,
      players: parsed.players,
      ip,
      submissionBatchId,
      signedAt,
    });

    const userId = await findLinkedUserIdForWaiverEmail(parsed.shared.signerEmail);
    if (userId) {
      await applyMatchingWaiverAcceptanceToUser(userId);
    }

    const playerNames = signatures.map((signature) =>
      buildWaiverPlayerFullName(signature.playerFirstName, signature.playerLastName),
    );

    try {
      await sendWaiverConfirmationEmail({
        to: parsed.shared.signerEmail,
        playerNames,
        signedAt,
        version: parsed.shared.version,
      });
    } catch (error) {
      console.error("Failed to send waiver confirmation email", error);
    }

    try {
      await sendCoachWaiverSignedPush({
        submissionBatchId,
        playerNames,
        teamName: parsed.shared.teamName,
        signupType: parsed.shared.signupType,
      });
    } catch (error) {
      console.error("Failed to send waiver signed coach push", error);
    }

    return jsonNoStore({
      success: true,
      playerNames,
    });
  } catch (error) {
    console.error("Failed to save waiver signature", error);
    return jsonNoStore({ error: "Unable to save waiver right now." }, { status: 500 });
  }
}
