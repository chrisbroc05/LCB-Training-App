import { requireAdminApiSession } from "@/lib/admin-api-auth";
import { jsonNoStore } from "@/lib/api-no-store";
import { createAdminClinic, listAdminClinics } from "@/lib/clinics-admin-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const clinics = await listAdminClinics();
  return jsonNoStore({ clinics });
}

export async function POST(request: Request) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

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
      : [];

  const result = await createAdminClinic({
    name: typeof body.name === "string" ? body.name : "",
    slug: typeof body.slug === "string" ? body.slug : null,
    location: typeof body.location === "string" ? body.location : "",
    agesSportsText: typeof body.agesSportsText === "string" ? body.agesSportsText : "",
    description: typeof body.description === "string" ? body.description : "",
    whatToBring: typeof body.whatToBring === "string" ? body.whatToBring : "",
    refundPolicyText: typeof body.refundPolicyText === "string" ? body.refundPolicyText : null,
    startTimeLocal: typeof body.startTimeLocal === "string" ? body.startTimeLocal : "",
    endTimeLocal: typeof body.endTimeLocal === "string" ? body.endTimeLocal : "",
    pricePerDayCents: Number(body.pricePerDayCents),
    allDaysPriceCents: Number(body.allDaysPriceCents),
    capacityPerDay: Number(body.capacityPerDay),
    active: body.active !== false,
    closed: Boolean(body.closed),
    dayDateKeys,
  });

  if (!result.ok) {
    return jsonNoStore({ error: result.error }, { status: 400 });
  }

  return jsonNoStore({ clinic: result.clinic });
}
