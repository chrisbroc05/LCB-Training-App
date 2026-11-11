import { requireAdminApiSession } from "@/lib/admin-api-auth";
import { jsonNoStore } from "@/lib/api-no-store";
import { previewDailyChallengeForDate } from "@/lib/daily-challenge-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const dateKey = url.searchParams.get("date")?.trim() ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return jsonNoStore({ error: "date must be YYYY-MM-DD." }, { status: 400 });
  }

  const preview = await previewDailyChallengeForDate(dateKey);
  return jsonNoStore({ preview });
}
