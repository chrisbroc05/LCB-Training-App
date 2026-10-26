import { requireAdminTestingSession } from "@/lib/admin-testing-auth";
import { buildSessionCsv } from "@/lib/testing-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
