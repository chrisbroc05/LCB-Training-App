import { requireAdminTestingSession } from "@/lib/admin-testing-auth";
import { dynamic, revalidate } from "@/lib/api-no-store";
import { buildSessionCsv } from "@/lib/testing-server";

export { dynamic, revalidate };

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { sessionId } = await context.params;
  const csv = await buildSessionCsv(sessionId);
  if (!csv) {
    return new Response("Session not found.", { status: 404 });
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="testing-session-${sessionId}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
