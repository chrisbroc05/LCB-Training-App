import { requireAdminApiSession } from "@/lib/admin-api-auth";
import { jsonNoStore } from "@/lib/api-no-store";
import { adminMarkClinicRegistrationRefunded } from "@/lib/clinics-admin-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: Promise<{ registrationId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { registrationId } = await context.params;
  const result = await adminMarkClinicRegistrationRefunded(registrationId);
  if (!result.processed) {
    return jsonNoStore(
      { error: "Registration not found or not in PAID status." },
      { status: 404 },
    );
  }

  return jsonNoStore({ ok: true, registrationId: result.registrationId });
}
