import type { TestBetterIs } from "@prisma/client";
import { requireAdminTestingSession } from "@/lib/admin-testing-auth";
import { jsonNoStore, dynamic, revalidate } from "@/lib/api-no-store";
import { listAllMetrics, upsertTestMetric } from "@/lib/testing-server";

export { dynamic, revalidate };

export async function GET() {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  const metrics = await listAllMetrics();
  return jsonNoStore({ metrics });
}

export async function POST(request: Request) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json()) as {
    key?: string;
    label?: string;
    unit?: string;
    decimals?: number;
    betterIs?: TestBetterIs;
    category?: string;
    active?: boolean;
    sortOrder?: number;
    inputType?: string;
  };

  if (
    !body.key?.trim() ||
    !body.label?.trim() ||
    !body.unit?.trim() ||
    body.decimals === undefined ||
    !body.betterIs ||
    !body.category?.trim() ||
    body.sortOrder === undefined
  ) {
    return jsonNoStore({ error: "Missing required metric fields." }, { status: 400 });
  }

  const metric = await upsertTestMetric({
    key: body.key,
    label: body.label,
    unit: body.unit,
    decimals: body.decimals,
    betterIs: body.betterIs,
    category: body.category,
    active: body.active ?? true,
    sortOrder: body.sortOrder,
    inputType: body.inputType,
  });

  return jsonNoStore({ metric });
}
