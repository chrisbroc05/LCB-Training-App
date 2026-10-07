import "server-only";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { jsonNoStore } from "@/lib/api-no-store";

export async function requireAdminTestingSession() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return { ok: false as const, response: jsonNoStore({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true as const, session };
}
