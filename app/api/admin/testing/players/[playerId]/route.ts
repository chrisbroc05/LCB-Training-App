import { requireAdminTestingSession } from "@/lib/admin-testing-auth";
import { jsonNoStore, dynamic, revalidate } from "@/lib/api-no-store";
import { getTestPlayerProfile, updateTestPlayer } from "@/lib/testing-server";

export { dynamic, revalidate };

type RouteContext = { params: Promise<{ playerId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { playerId } = await context.params;
  const profile = await getTestPlayerProfile(playerId);
  if (!profile) {
    return jsonNoStore({ error: "Player not found." }, { status: 404 });
  }
  return jsonNoStore(profile);
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { playerId } = await context.params;
  const body = (await request.json()) as Partial<{
    firstName: string;
    lastName: string;
    age: number | null;
    birthYear: number | null;
    positions: string[];
    bats: string | null;
    throws: string | null;
    parentEmail: string | null;
  }>;

  const player = await updateTestPlayer(playerId, body);
  return jsonNoStore({ player });
}
