import "server-only";

import { randomUUID } from "crypto";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import {
  attachClinicRegistrationToExistingUser,
  createClinicParentAccount,
  createClinicSetPasswordToken,
  findClinicUserByParentEmail,
  upsertClinicMarketingLead,
} from "@/lib/clinics-account-server";
import { expireStaleClinicHolds } from "@/lib/clinics-capacity-server";
import {
  sendClinicCoachPaidRegistrationEmail,
  sendClinicRegistrationConfirmationEmail,
} from "@/lib/clinics-emails-server";
import { formatClinicDayWithTimeLabel } from "@/lib/clinics-shared";
import { splitPlayerName } from "@/lib/testing-shared";
import { WAIVER_VERSION } from "@/lib/waiver-sign-shared";
import { linkWaiverSignaturesToUser } from "@/lib/waiver-sign-server";

export async function releaseClinicCheckoutSession(session: Stripe.Checkout.Session) {
  const registrationId = session.metadata?.clinicRegistrationId?.trim();
  const sessionId = session.id;
  if (!registrationId && !sessionId) {
    return { released: false as const };
  }

  const registration = await prisma.clinicRegistration.findFirst({
    where: {
      status: "PENDING",
      OR: [
        ...(registrationId ? [{ id: registrationId }] : []),
        ...(sessionId ? [{ stripeCheckoutSessionId: sessionId }] : []),
      ],
    },
    select: { id: true },
  });

  if (!registration) {
    return { released: false as const };
  }

  await prisma.clinicRegistration.update({
    where: { id: registration.id },
    data: {
      status: "EXPIRED",
      updatedAt: new Date(),
    },
  });

  return { released: true as const, registrationId: registration.id };
}

export async function markClinicRegistrationRefunded(params: {
  registrationId?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  refundedAt?: Date;
}) {
  const refundedAt = params.refundedAt ?? new Date();
  const registration = await prisma.clinicRegistration.findFirst({
    where: {
      status: "PAID",
      OR: [
        ...(params.registrationId ? [{ id: params.registrationId }] : []),
        ...(params.stripeCheckoutSessionId
          ? [{ stripeCheckoutSessionId: params.stripeCheckoutSessionId }]
          : []),
        ...(params.stripePaymentIntentId
          ? [{ stripePaymentIntentId: params.stripePaymentIntentId }]
          : []),
      ],
    },
    select: { id: true },
  });

  if (!registration) {
    return { processed: false as const };
  }

  await prisma.clinicRegistration.update({
    where: { id: registration.id },
    data: {
      status: "REFUNDED",
      refundedAt,
      updatedAt: refundedAt,
    },
  });

  return { processed: true as const, registrationId: registration.id };
}

export async function fulfillClinicCheckoutSession(session: Stripe.Checkout.Session) {
  await expireStaleClinicHolds();

  const registrationId = session.metadata?.clinicRegistrationId?.trim();
  if (!registrationId || !session.id) {
    return { ok: false as const, reason: "missing_metadata" as const };
  }

  const existingPaid = await prisma.clinicRegistration.findFirst({
    where: {
      OR: [
        { id: registrationId, status: "PAID" },
        { stripeCheckoutSessionId: session.id, status: "PAID" },
      ],
    },
    select: { id: true },
  });
  if (existingPaid) {
    return { ok: true as const, alreadyFulfilled: true as const };
  }

  const registration = await prisma.clinicRegistration.findUnique({
    where: { id: registrationId },
    include: {
      clinic: true,
      days: { include: { clinicDay: true }, orderBy: { clinicDay: { sortOrder: "asc" } } },
    },
  });

  if (!registration) {
    return { ok: false as const, reason: "registration_not_found" as const };
  }

  if (registration.status === "REFUNDED" || registration.status === "CANCELLED") {
    return { ok: false as const, reason: "invalid_status" as const };
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const paidAt = new Date();
  const { firstName, lastName } = splitPlayerName(registration.playerName);
  const playerFirstName = firstName || registration.playerName.trim();
  const playerLastName = lastName || "Player";

  const existingUser = await findClinicUserByParentEmail(registration.parentEmail);
  let userId = existingUser?.id ?? null;
  let setPasswordUrl: string | null = null;
  let createdNewAccount = false;

  if (!userId) {
    const created = await createClinicParentAccount({
      parentName: registration.parentName,
      parentEmail: registration.parentEmail,
      playerName: registration.playerName,
      playerAge: registration.playerAge,
      mediaConsent: registration.mediaConsent,
      acceptedByName: registration.acceptedByName,
      acceptedAt: registration.termsAcceptedAt,
    });
    userId = created.id;
    createdNewAccount = true;
    const token = await createClinicSetPasswordToken(created.id);
    setPasswordUrl = token.resetUrl;
  } else if (existingUser) {
    await attachClinicRegistrationToExistingUser({
      registrationId: registration.id,
      userId: existingUser.id,
    });
    // Webhook retry race: account may already exist from a partial fulfill. Still send set-password
    // when this FREE parent was created during this registration's checkout window.
    const createdDuringCheckout =
      existingUser.createdAt.getTime() >= registration.createdAt.getTime() - 60_000;
    if (existingUser.membershipTier === "FREE" && createdDuringCheckout) {
      createdNewAccount = true;
      const token = await createClinicSetPasswordToken(existingUser.id);
      setPasswordUrl = token.resetUrl;
    }
  }

  const waiver = await prisma.waiverSignature.create({
    data: {
      playerFirstName,
      playerLastName,
      playerAge: registration.playerAge,
      teamName: registration.clinic.name,
      teamSlug: null,
      signupType: "GROUP_LESSONS",
      signerFullName: registration.typedSignature,
      signerEmail: registration.parentEmail.toLowerCase(),
      signerPhone: registration.parentPhone,
      emergencyContactName: registration.emergencyContactName,
      emergencyContactPhone: registration.emergencyContactPhone,
      mediaConsent: registration.mediaConsent,
      typedSignature: registration.typedSignature,
      version: WAIVER_VERSION,
      ip: registration.clientIp ?? "unknown",
      submissionBatchId: randomUUID(),
      signedAt: paidAt,
      userId,
    },
  });

  await linkWaiverSignaturesToUser(userId, registration.parentEmail);

  await prisma.clinicRegistration.update({
    where: { id: registration.id },
    data: {
      status: "PAID",
      userId,
      waiverSignatureId: waiver.id,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      paidAt,
      holdExpiresAt: null,
      updatedAt: paidAt,
    },
  });

  if (registration.marketingOptIn) {
    try {
      await upsertClinicMarketingLead({
        parentEmail: registration.parentEmail,
        parentName: registration.parentName,
        userId,
      });
    } catch (error) {
      console.error("Failed to upsert clinic marketing lead", error);
    }
  }

  const dayLabels = registration.days.map((row) =>
    formatClinicDayWithTimeLabel(
      row.clinicDay.date,
      registration.clinic.startTimeLocal,
      registration.clinic.endTimeLocal,
    ),
  );

  try {
    await sendClinicRegistrationConfirmationEmail({
      toEmail: registration.parentEmail,
      parentName: registration.parentName,
      clinicName: registration.clinic.name,
      dayLabels,
      startTimeLocal: registration.clinic.startTimeLocal,
      endTimeLocal: registration.clinic.endTimeLocal,
      location: registration.clinic.location,
      whatToBring: registration.clinic.whatToBring,
      refundPolicyText: registration.clinic.refundPolicyText,
      setPasswordUrl,
    });
  } catch (error) {
    console.error("Failed to send clinic confirmation email", error);
  }

  try {
    await sendClinicCoachPaidRegistrationEmail({
      clinicName: registration.clinic.name,
      playerName: registration.playerName,
      playerAge: registration.playerAge,
      dayLabels,
      amountCents: registration.amountCents,
      parentName: registration.parentName,
      parentEmail: registration.parentEmail,
    });
  } catch (error) {
    console.error("Failed to send clinic coach notification email", error);
  }

  return {
    ok: true as const,
    alreadyFulfilled: false as const,
    registrationId: registration.id,
    userId,
    createdNewAccount,
  };
}
