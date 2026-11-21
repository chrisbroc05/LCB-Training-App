import { requireAdminTestingSession } from "@/lib/admin-testing-auth";
import { jsonNoStore } from "@/lib/api-no-store";
import { createTestPlayer, searchTestPlayers } from "@/lib/testing-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim() ?? "";
    const players = await searchTestPlayers(query);
    return jsonNoStore({ players });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to search players.";
    return jsonNoStore({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      age?: number | null;
      birthYear?: number | null;
      positions?: string[];
      bats?: string | null;
      throws?: string | null;
      parentEmail?: string | null;
      userId?: string | null;
      teamId?: string | null;
    };

    if (!body.firstName?.trim() || !body.lastName?.trim()) {
      return jsonNoStore({ error: "First and last name are required." }, { status: 400 });
    }

    const player = await createTestPlayer({
      firstName: body.firstName,
      lastName: body.lastName,
      age: body.age,
      birthYear: body.birthYear,
      positions: body.positions,
      bats: body.bats,
      throws: body.throws,
      parentEmail: body.parentEmail,
      userId: body.userId,
      teamId: body.teamId,
    });

    return jsonNoStore({ player });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add player.";
    return jsonNoStore({ error: message }, { status: 500 });
  }
}
