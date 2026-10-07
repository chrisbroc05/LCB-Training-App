import { requireAdminTestingSession } from "@/lib/admin-testing-auth";
import { jsonNoStore, dynamic, revalidate } from "@/lib/api-no-store";
import { createTestSession } from "@/lib/testing-server";

export { dynamic, revalidate };

type RouteContext = { params: Promise<{ teamId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { teamId } = await context.params;
  const body = (await request.json()) as {
    date?: string;
    label?: string;
    notes?: string | null;
  };

  if (!body.date?.trim() || !body.label?.trim()) {
    return jsonNoStore({ error: "Date and label are required." }, { status: 400 });
  }

  const session = await createTestSession(teamId, {
    date: body.date,
    label: body.label,
    notes: body.notes,
  });

  return jsonNoStore({ session });
}
