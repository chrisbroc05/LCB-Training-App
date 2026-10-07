import { requireAdminTestingSession } from "@/lib/admin-testing-auth";
import { jsonNoStore, dynamic, revalidate } from "@/lib/api-no-store";
import { getTestingWorkspace } from "@/lib/testing-server";

export { dynamic, revalidate };

export async function GET(request: Request) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const teamSlug = url.searchParams.get("teamSlug")?.trim();
  const date = url.searchParams.get("date")?.trim() || new Date().toISOString().slice(0, 10);

  if (!teamSlug) {
    return jsonNoStore({ error: "teamSlug is required." }, { status: 400 });
  }

  try {
    const workspace = await getTestingWorkspace(teamSlug, date);
    return jsonNoStore(workspace);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load workspace.";
    return jsonNoStore({ error: message }, { status: 500 });
  }
}
