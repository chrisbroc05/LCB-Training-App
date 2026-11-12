import { requireAdminApiSession } from "@/lib/admin-api-auth";
import { jsonNoStore } from "@/lib/api-no-store";
import { getAdminClinicDetail, updateAdminClinic } from "@/lib/clinics-admin-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const clinic = await getAdminClinicDetail(id);
  if (!clinic) {
    return jsonNoStore({ error: "Clinic not found." }, { status: 404 });
  }
  return jsonNoStore({ clinic });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonNoStore({ error: "Invalid request body." }, { status: 400 });
  }

  const dayDateKeys = Array.isArray(body.dayDateKeys)
    ? body.dayDateKeys.filter((value): value is string => typeof value === "string")
    : typeof body.daysCsv === "string"
      ? body.daysCsv
          .split(/[\n,]+/)
          .map((value) => value.trim())
          .filter(Boolean)
      : undefined;

  const result = await updateAdminClinic(id, {
    name: typeof body.name === "string" ? body.name : undefined,
    location: typeof body.location === "string" ? body.location : undefined,
    agesSportsText: typeof body.agesSportsText === "string" ? body.agesSportsText : undefined,
    description: typeof body.description === "string" ? body.description : undefined,
    whatToBring: typeof body.whatToBring === "string" ? body.whatToBring : undefined,
    refundPolicyText:
      typeof body.refundPolicyText === "string" ? body.refundPolicyText : undefined,
    startTimeLocal: typeof body.startTimeLocal === "string" ? body.startTimeLocal : undefined,
    endTimeLocal: typeof body.endTimeLocal === "string" ? body.endTimeLocal : undefined,
    pricePerDayCents:
      body.pricePerDayCents !== undefined ? Number(body.pricePerDayCents) : undefined,
    allDaysPriceCents:
      body.allDaysPriceCents !== undefined ? Number(body.allDaysPriceCents) : undefined,
    capacityPerDay: body.capacityPerDay !== undefined ? Number(body.capacityPerDay) : undefined,
    active: typeof body.active === "boolean" ? body.active : undefined,
    closed: typeof body.closed === "boolean" ? body.closed : undefined,
    dayDateKeys,
  });

  if (!result.ok) {
    return jsonNoStore({ error: result.error }, { status: 400 });
  }

  const clinic = await getAdminClinicDetail(id);
  return jsonNoStore({ clinic });
}
