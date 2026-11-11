import { requireAdminApiSession } from "@/lib/admin-api-auth";
import { jsonNoStore } from "@/lib/api-no-store";
import { commitDailyChallengeCsvImport } from "@/lib/daily-challenge-csv-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json()) as { csvText?: string };
  if (!body.csvText?.trim()) {
    return jsonNoStore({ error: "CSV text is required." }, { status: 400 });
  }

  const result = await commitDailyChallengeCsvImport(body.csvText);
  if (!result.ok) {
    return jsonNoStore({ error: result.error }, { status: 400 });
  }

  return jsonNoStore({ result: result.result });
}
