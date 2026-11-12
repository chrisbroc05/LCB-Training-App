import { requireAdminApiSession } from "@/lib/admin-api-auth";
import { jsonNoStore } from "@/lib/api-no-store";
import { buildClinicRosterCsv } from "@/lib/clinics-admin-server";

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
  const exportPayload = await buildClinicRosterCsv(id);
  if (!exportPayload) {
    return jsonNoStore({ error: "Clinic not found." }, { status: 404 });
  }

  return new Response(exportPayload.csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportPayload.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
