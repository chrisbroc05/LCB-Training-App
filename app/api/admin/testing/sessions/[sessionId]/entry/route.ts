import { requireAdminTestingSession } from "@/lib/admin-testing-auth";
import { jsonNoStore, dynamic, revalidate } from "@/lib/api-no-store";
import { getSessionEntryData } from "@/lib/testing-server";

export { dynamic, revalidate };

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { sessionId } = await context.params;
  const url = new URL(request.url);
  const metricKey = url.searchParams.get("metricKey");
  if (!metricKey) {
    return jsonNoStore({ error: "metricKey is required." }, { status: 400 });
  }

  const entry = await getSessionEntryData(sessionId, metricKey);
  if (!entry) {
    return jsonNoStore({ error: "Session or metric not found." }, { status: 404 });
  }
  return jsonNoStore(entry);
}
