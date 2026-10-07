import { requireAdminTestingSession } from "@/lib/admin-testing-auth";
import { jsonNoStore, dynamic, revalidate } from "@/lib/api-no-store";
import { commitCsvImport } from "@/lib/testing-server";

export { dynamic, revalidate };

type RouteContext = { params: Promise<{ teamId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { teamId } = await context.params;
  const body = (await request.json()) as {
    sessionDate?: string;
    sessionLabel?: string;
    rows?: Array<{
      firstName: string;
      lastName: string;
      age: number | null;
      playerId?: string | null;
      metrics: Record<string, number | null>;
    }>;
  };

  if (!body.sessionDate?.trim() || !body.sessionLabel?.trim() || !body.rows?.length) {
    return jsonNoStore({ error: "Session date, label, and rows are required." }, { status: 400 });
  }

  const session = await commitCsvImport({
    teamId,
    sessionDate: body.sessionDate,
    sessionLabel: body.sessionLabel,
    rows: body.rows,
  });

  return jsonNoStore({ session });
}
