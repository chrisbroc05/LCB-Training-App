import { NextResponse } from "next/server";
import { startClinicCheckout } from "@/lib/clinics-checkout-server";
import { getRequestIp } from "@/lib/waiver-sign-server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  if (!slug?.trim()) {
    return NextResponse.json({ error: "Clinic not found." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const dayIds = Array.isArray(body.dayIds)
    ? body.dayIds.filter((value): value is string => typeof value === "string")
    : [];

  const playerAgeRaw = body.playerAge;
  const playerAge =
    typeof playerAgeRaw === "number"
      ? playerAgeRaw
      : typeof playerAgeRaw === "string"
        ? Number(playerAgeRaw)
        : NaN;

  const result = await startClinicCheckout({
    clinicSlug: slug.trim(),
    input: {
      parentName: typeof body.parentName === "string" ? body.parentName : "",
      parentEmail: typeof body.parentEmail === "string" ? body.parentEmail : "",
      parentPhone: typeof body.parentPhone === "string" ? body.parentPhone : null,
      playerName: typeof body.playerName === "string" ? body.playerName : "",
      playerAge,
      sport: typeof body.sport === "string" ? body.sport : "",
      position: typeof body.position === "string" ? body.position : null,
      dayIds,
      isAllDaysBundle: Boolean(body.isAllDaysBundle),
      termsAccepted: Boolean(body.termsAccepted),
      mediaConsent: Boolean(body.mediaConsent),
      marketingOptIn: Boolean(body.marketingOptIn),
      emergencyContactName:
        typeof body.emergencyContactName === "string" ? body.emergencyContactName : "",
      emergencyContactPhone:
        typeof body.emergencyContactPhone === "string" ? body.emergencyContactPhone : "",
      typedSignature: typeof body.typedSignature === "string" ? body.typedSignature : "",
      clientIp: getRequestIp(request),
    },
  });

  if (!result.ok) {
    const status = result.soldOutDays?.length ? 409 : 400;
    return NextResponse.json(
      {
        error: result.error,
        ...(result.soldOutDays ? { soldOutDays: result.soldOutDays } : {}),
      },
      { status },
    );
  }

  return NextResponse.json({
    checkoutUrl: result.checkoutUrl,
    registrationId: result.registrationId,
    amountCents: result.amountCents,
    amountLabel: result.amountLabel,
    holdMinutes: result.holdMinutes,
  });
}
