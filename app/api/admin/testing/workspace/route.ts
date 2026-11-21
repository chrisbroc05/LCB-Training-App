import { requireAdminTestingSession } from "@/lib/admin-testing-auth";
import { jsonNoStore } from "@/lib/api-no-store";
import {
  getIndividualTestingWorkspace,
  getTestingWorkspace,
} from "@/lib/testing-server";
import { normalizeTestSessionDateKey } from "@/lib/testing-shared";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode")?.trim() === "individual" ? "individual" : "team";
  const teamSlug = url.searchParams.get("teamSlug")?.trim();
  const date = normalizeTestSessionDateKey(url.searchParams.get("date"));

  if (mode === "team" && !teamSlug) {
    return jsonNoStore({ error: "teamSlug is required." }, { status: 400 });
  }

  try {
    const workspace =
      mode === "individual"
        ? await getIndividualTestingWorkspace(date)
        : await getTestingWorkspace(teamSlug!, date);
    return jsonNoStore(workspace);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load workspace.";
    return jsonNoStore({ error: message }, { status: 500 });
  }
}
