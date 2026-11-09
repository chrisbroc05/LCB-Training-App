import { requireAdminTestingSession } from "@/lib/admin-testing-auth";
import { jsonNoStore } from "@/lib/api-no-store";
import { previewResultsCsvImport } from "@/lib/testing-results-csv-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json()) as { csvText?: string };
  if (!body.csvText?.trim()) {
    return jsonNoStore({ error: "CSV text is required." }, { status: 400 });
  }

  const preview = await previewResultsCsvImport(body.csvText);
  if (!preview.ok) {
    return jsonNoStore({ error: preview.error }, { status: 400 });
  }

  return jsonNoStore({ preview });
}
