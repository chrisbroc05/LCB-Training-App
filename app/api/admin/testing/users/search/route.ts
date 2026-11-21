import { requireAdminTestingSession } from "@/lib/admin-testing-auth";
import { jsonNoStore } from "@/lib/api-no-store";
import { searchTestingUsers } from "@/lib/testing-server";

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
    const users = await searchTestingUsers(query);
    return jsonNoStore({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to search accounts.";
    return jsonNoStore({ error: message }, { status: 500 });
  }
}
