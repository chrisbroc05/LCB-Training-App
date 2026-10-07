import { requireAdminTestingSession } from "@/lib/admin-testing-auth";
import { jsonNoStore, dynamic, revalidate } from "@/lib/api-no-store";
import { createTestTeam, listTestingTeamOptions } from "@/lib/testing-server";

export { dynamic, revalidate };

export async function GET() {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  const teams = await listTestingTeamOptions();
  return jsonNoStore({ teams });
}

export async function POST(request: Request) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json()) as { name?: string };

  if (!body.name?.trim()) {
    return jsonNoStore({ error: "Team name is required." }, { status: 400 });
  }

  const team = await createTestTeam({ name: body.name });
  return jsonNoStore({
    team: {
      teamSlug: team.teamSlug,
      name: team.name,
      teamId: team.id,
    },
  });
}
