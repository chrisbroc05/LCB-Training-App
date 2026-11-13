import "server-only";

import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getPublicAppUrl } from "@/lib/public-app-url";
import {
  LEGAL_DOCS_VERSION,
  LEGAL_MAX_PLAYER_AGE,
  LEGAL_MIN_PLAYER_AGE,
  validateAcceptedByName,
} from "@/lib/legal-shared";
import { isValidEmailFormat } from "@/lib/second-email-shared";
import {
  assertClinicDaysHaveCapacity,
  clinicHoldExpiresAt,
  expireStaleClinicHolds,
} from "@/lib/clinics-capacity-server";
import {
  CLINIC_HOLD_MINUTES,
  CLINIC_PURCHASE_TYPE,
  computeClinicAmountCents,
  formatClinicDayLabel,
  formatClinicMoney,
  isClinicSportKey,
  type ClinicSportKey,
} from "@/lib/clinics-shared";

export type ClinicCheckoutInput = {
  parentName: string;
  parentEmail: string;
  parentPhone?: string | null;
  playerName: string;
  playerAge: number;
  sport: string;
  position?: string | null;
  dayIds: string[];
  isAllDaysBundle: boolean;
  termsAccepted: boolean;
  mediaConsent: boolean;
  marketingOptIn: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
  typedSignature: string;
  clientIp?: string | null;
};

function normalizePhone(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

export async function startClinicCheckout(params: {
  clinicSlug: string;
  input: ClinicCheckoutInput;
}) {
  await expireStaleClinicHolds();

  const clinic = await prisma.clinic.findUnique({
    where: { slug: params.clinicSlug },
    include: {
      days: { orderBy: [{ sortOrder: "asc" }, { date: "asc" }] },
    },
  });

  if (!clinic || !clinic.active || clinic.closed) {
    return { ok: false as const, error: "This clinic is not open for signup." };
  }

  const input = params.input;
  const parentName = input.parentName.trim();
  const parentEmail = input.parentEmail.trim().toLowerCase();
  const playerName = input.playerName.trim();
  const emergencyContactName = input.emergencyContactName.trim();
  const emergencyContactPhone = input.emergencyContactPhone.trim();
  const typedSignature = input.typedSignature.trim();
  const acceptedByError = validateAcceptedByName(parentName);
  if (acceptedByError) {
    return { ok: false as const, error: "Enter the parent or guardian full name (first and last)." };
  }
  if (!isValidEmailFormat(parentEmail)) {
    return { ok: false as const, error: "Enter a valid parent email." };
  }
  if (!playerName) {
    return { ok: false as const, error: "Enter the player's name." };
  }
  if (
    !Number.isFinite(input.playerAge) ||
    input.playerAge < LEGAL_MIN_PLAYER_AGE ||
    input.playerAge > LEGAL_MAX_PLAYER_AGE
  ) {
    return {
      ok: false as const,
      error: `Enter a valid player age (${LEGAL_MIN_PLAYER_AGE}-${LEGAL_MAX_PLAYER_AGE}).`,
    };
  }
  if (!isClinicSportKey(input.sport)) {
    return { ok: false as const, error: "Choose baseball or softball." };
  }
  if (!input.termsAccepted) {
    return {
      ok: false as const,
      error: "Confirm you are the parent or guardian and agree to the Terms and waiver.",
    };
  }
  if (!emergencyContactName || !emergencyContactPhone) {
    return { ok: false as const, error: "Enter an emergency contact name and phone." };
  }
  const signatureError = validateAcceptedByName(typedSignature);
  if (signatureError) {
    return {
      ok: false as const,
      error: "Type your full name as your signature (first and last).",
    };
  }
  if (typedSignature.toLowerCase() !== parentName.toLowerCase()) {
    return {
      ok: false as const,
      error: "Typed signature must match the parent or guardian full name.",
    };
  }

  const clinicDayIds = clinic.days.map((day) => day.id);
  const selectedIds = [...new Set(input.dayIds.map((id) => id.trim()).filter(Boolean))];
  if (selectedIds.length === 0) {
    return { ok: false as const, error: "Pick at least one clinic day." };
  }
  if (selectedIds.some((id) => !clinicDayIds.includes(id))) {
    return { ok: false as const, error: "One or more selected days are invalid." };
  }

  const selectingAllDays = selectedIds.length === clinic.days.length && clinic.days.length > 1;
  // Selecting every day (individually or via the bundle checkbox) always uses all-days pricing.
  const isAllDaysBundle = selectingAllDays;
  if (input.isAllDaysBundle && !selectingAllDays) {
    return { ok: false as const, error: "All-days pricing requires every available day." };
  }

  const soldOutLabels = await assertClinicDaysHaveCapacity({
    clinicDayIds: selectedIds,
    capacityPerDay: clinic.capacityPerDay,
  });
  if (soldOutLabels.length > 0) {
    return {
      ok: false as const,
      error: `Sold out: ${soldOutLabels.join(", ")}. Pick different days.`,
      soldOutDays: soldOutLabels,
    };
  }

  const amountCents = computeClinicAmountCents({
    selectedDayCount: selectedIds.length,
    totalDayCount: clinic.days.length,
    pricePerDayCents: clinic.pricePerDayCents,
    allDaysPriceCents: clinic.allDaysPriceCents,
    isAllDaysBundle,
  });
  if (amountCents <= 0) {
    return { ok: false as const, error: "Invalid checkout amount." };
  }

  const now = new Date();
  const holdExpiresAt = clinicHoldExpiresAt(now);

  const registration = await prisma.clinicRegistration.create({
    data: {
      clinicId: clinic.id,
      parentName,
      parentEmail,
      parentPhone: normalizePhone(input.parentPhone),
      playerName,
      playerAge: Math.round(input.playerAge),
      sport: input.sport as ClinicSportKey,
      position: input.position?.trim() || null,
      emergencyContactName,
      emergencyContactPhone,
      typedSignature,
      termsAcceptedAt: now,
      termsVersion: LEGAL_DOCS_VERSION,
      waiverAcknowledgedAt: now,
      acceptedByName: parentName,
      mediaConsent: Boolean(input.mediaConsent),
      mediaConsentUpdatedAt: now,
      marketingOptIn: Boolean(input.marketingOptIn),
      isAllDaysBundle,
      amountCents,
      status: "PENDING",
      holdExpiresAt,
      clientIp: input.clientIp?.trim() || null,
      days: {
        create: selectedIds.map((clinicDayId) => ({ clinicDayId })),
      },
    },
    include: {
      days: { include: { clinicDay: true } },
    },
  });

  const dayLabels = registration.days
    .slice()
    .sort((a, b) => a.clinicDay.sortOrder - b.clinicDay.sortOrder)
    .map((row) => formatClinicDayLabel(row.clinicDay.date));

  const productName = isAllDaysBundle
    ? `${clinic.name} - all ${clinic.days.length} days`
    : `${clinic.name} - ${dayLabels.join(", ")}`;

  const expiresAt = Math.floor(holdExpiresAt.getTime() / 1000);
  const appUrl = getPublicAppUrl();

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      expires_at: expiresAt,
      customer_email: parentEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: productName,
              description: `${clinic.location} | ${clinic.startTimeLocal}-${clinic.endTimeLocal}`,
            },
          },
        },
      ],
      success_url: `${appUrl}/clinics/${clinic.slug}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/clinics/${clinic.slug}?checkout=cancelled&session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        purchaseType: CLINIC_PURCHASE_TYPE,
        clinicId: clinic.id,
        clinicRegistrationId: registration.id,
        clinicSlug: clinic.slug,
      },
      payment_intent_data: {
        metadata: {
          purchaseType: CLINIC_PURCHASE_TYPE,
          clinicId: clinic.id,
          clinicRegistrationId: registration.id,
        },
      },
    });

    if (!session.url || !session.id) {
      await prisma.clinicRegistration.update({
        where: { id: registration.id },
        data: { status: "CANCELLED" },
      });
      return { ok: false as const, error: "Could not start Stripe Checkout." };
    }

    await prisma.clinicRegistration.update({
      where: { id: registration.id },
      data: { stripeCheckoutSessionId: session.id },
    });

    return {
      ok: true as const,
      checkoutUrl: session.url,
      registrationId: registration.id,
      amountCents,
      holdMinutes: CLINIC_HOLD_MINUTES,
      amountLabel: formatClinicMoney(amountCents),
    };
  } catch (error) {
    await prisma.clinicRegistration.update({
      where: { id: registration.id },
      data: { status: "CANCELLED" },
    });
    console.error("Clinic Stripe checkout failed", error);
    return { ok: false as const, error: "Could not start Stripe Checkout." };
  }
}
