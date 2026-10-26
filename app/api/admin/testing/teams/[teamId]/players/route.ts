import { requireAdminTestingSession } from "@/lib/admin-testing-auth";
import { jsonNoStore } from "@/lib/api-no-store";
import { addPlayerToTeam } from "@/lib/testing-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = { params: Promise<{ teamId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { teamId } = await context.params;
  const body = (await request.json()) as {
    firstName?: string;
    lastName?: string;
    age?: number | null;
    birthYear?: number | null;
    positions?: string[];
    bats?: string | null;
    throws?: string | null;
    parentEmail?: string | null;
  };

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
  });

  return jsonNoStore({ player });
}
