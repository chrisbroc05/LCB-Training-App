import { requireAdminTestingSession } from "@/lib/admin-testing-auth";
import { jsonNoStore, dynamic, revalidate } from "@/lib/api-no-store";
import { getTestTeamDetail, updateTestTeam } from "@/lib/testing-server";

export { dynamic, revalidate };

type RouteContext = { params: Promise<{ teamId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { teamId } = await context.params;
  const detail = await getTestTeamDetail(teamId);
  if (!detail) {
    return jsonNoStore({ error: "Team not found." }, { status: 404 });
  }
  return jsonNoStore(detail);
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { teamId } = await context.params;
  const body = (await request.json()) as Partial<{
    name: string;
    season: string;
    coachName: string;
    coachEmail: string | null;
    archived: boolean;
  }>;

  const team = await updateTestTeam(teamId, body);
  return jsonNoStore({ team });
}
