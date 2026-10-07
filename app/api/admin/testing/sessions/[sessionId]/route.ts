import { requireAdminTestingSession } from "@/lib/admin-testing-auth";
import { jsonNoStore, dynamic, revalidate } from "@/lib/api-no-store";
import { getSessionResultsGrid } from "@/lib/testing-server";

export { dynamic, revalidate };

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { sessionId } = await context.params;
  const grid = await getSessionResultsGrid(sessionId);
  if (!grid) {
    return jsonNoStore({ error: "Session not found." }, { status: 404 });
  }
  return jsonNoStore(grid);
}
