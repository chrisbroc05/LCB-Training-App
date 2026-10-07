import { requireAdminTestingSession } from "@/lib/admin-testing-auth";
import { jsonNoStore, dynamic, revalidate } from "@/lib/api-no-store";
import { upsertTestResult } from "@/lib/testing-server";

export { dynamic, revalidate };

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { sessionId } = await context.params;
  const body = (await request.json()) as {
    playerId?: string;
    metricKey?: string;
    attempts?: number[];
    absent?: boolean;
    skipped?: boolean;
    notes?: string | null;
  };

  if (!body.playerId || !body.metricKey) {
    return jsonNoStore({ error: "playerId and metricKey are required." }, { status: 400 });
  }

  const result = await upsertTestResult({
    sessionId,
    playerId: body.playerId,
    metricKey: body.metricKey,
    attempts: body.attempts,
    absent: body.absent,
    skipped: body.skipped,
    notes: body.notes,
  });

  return jsonNoStore({ result });
}
