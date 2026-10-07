import { requireAdminTestingSession } from "@/lib/admin-testing-auth";
import { jsonNoStore, dynamic, revalidate } from "@/lib/api-no-store";
import { listAllStations, upsertTestStation } from "@/lib/testing-server";

export { dynamic, revalidate };

export async function GET() {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  const stations = await listAllStations();
  return jsonNoStore({ stations });
}

export async function POST(request: Request) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json()) as {
    key?: string;
    label?: string;
    sortOrder?: number;
    active?: boolean;
    metricKeys?: string[];
  };

  if (!body.key?.trim() || !body.label?.trim() || !Array.isArray(body.metricKeys)) {
    return jsonNoStore({ error: "Key, label, and metricKeys are required." }, { status: 400 });
  }

  const station = await upsertTestStation({
    key: body.key,
    label: body.label,
    sortOrder: Number(body.sortOrder ?? 100),
    active: body.active ?? true,
    metricKeys: body.metricKeys,
  });

  return jsonNoStore({ station });
}
