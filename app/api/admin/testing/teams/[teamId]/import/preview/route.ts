import { requireAdminTestingSession } from "@/lib/admin-testing-auth";
import { jsonNoStore, dynamic, revalidate } from "@/lib/api-no-store";
import { buildCsvImportPreview } from "@/lib/testing-server";

export { dynamic, revalidate };

type RouteContext = { params: Promise<{ teamId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { teamId } = await context.params;
  const body = (await request.json()) as {
    csvText?: string;
    columnMap?: Record<string, string>;
  };

  if (!body.csvText?.trim() || !body.columnMap) {
    return jsonNoStore({ error: "CSV text and column map are required." }, { status: 400 });
  }

  const preview = await buildCsvImportPreview({
    teamId,
    csvText: body.csvText,
    columnMap: body.columnMap,
  });

  return jsonNoStore({ preview });
}
