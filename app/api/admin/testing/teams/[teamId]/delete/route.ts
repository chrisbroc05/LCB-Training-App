import { requireAdminTestingSession } from "@/lib/admin-testing-auth";
import { jsonNoStore } from "@/lib/api-no-store";
import {
  deleteTestTeam,
  getTestTeamDeletePreview,
  type TestTeamDeleteResultsAction,
} from "@/lib/testing-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = { params: Promise<{ teamId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { teamId } = await context.params;
    const preview = await getTestTeamDeletePreview(teamId);
    if (!preview) {
      return jsonNoStore({ error: "Team not found." }, { status: 404 });
    }
    return jsonNoStore({ preview });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load delete preview.";
    return jsonNoStore({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { teamId } = await context.params;
    const body = (await request.json()) as {
      confirmName?: string;
      resultsAction?: TestTeamDeleteResultsAction;
    };

    if (!body.confirmName?.trim()) {
      return jsonNoStore({ error: "Type the exact team name to confirm delete." }, { status: 400 });
    }

    const resultsAction: TestTeamDeleteResultsAction =
      body.resultsAction === "delete" ? "delete" : "move";

    const result = await deleteTestTeam(teamId, {
      confirmName: body.confirmName,
      resultsAction,
    });

    return jsonNoStore({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete team.";
    return jsonNoStore({ error: message }, { status: 500 });
  }
}
