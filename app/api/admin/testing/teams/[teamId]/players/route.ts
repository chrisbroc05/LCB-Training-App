import { requireAdminTestingSession } from "@/lib/admin-testing-auth";
import { jsonNoStore } from "@/lib/api-no-store";
import { addExistingPlayerToTeam, addPlayerToTeam } from "@/lib/testing-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = { params: Promise<{ teamId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { teamId } = await context.params;
    const body = (await request.json()) as {
      existingPlayerId?: string;
      firstName?: string;
      lastName?: string;
      age?: number | null;
      birthYear?: number | null;
      positions?: string[];
      bats?: string | null;
      throws?: string | null;
      parentEmail?: string | null;
      userId?: string | null;
    };

    if (body.existingPlayerId?.trim()) {
      const player = await addExistingPlayerToTeam(teamId, body.existingPlayerId.trim());
      return jsonNoStore({ player });
    }

    if (!body.firstName?.trim() || !body.lastName?.trim()) {
      return jsonNoStore({ error: "First and last name are required." }, { status: 400 });
    }

    const player = await addPlayerToTeam(teamId, {
      firstName: body.firstName,
      lastName: body.lastName,
      age: body.age,
      birthYear: body.birthYear,
      positions: body.positions,
      bats: body.bats,
      throws: body.throws,
      parentEmail: body.parentEmail,
      userId: body.userId,
    });

    return jsonNoStore({ player });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add player.";
    return jsonNoStore({ error: message }, { status: 500 });
  }
}
