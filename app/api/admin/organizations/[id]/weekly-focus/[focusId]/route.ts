import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  buildAdminWeeklyFocusPayload,
  deleteAdminOrgWeeklyFocus,
} from "@/lib/org-weekly-focus-admin-server";

type RouteContext = { params: Promise<{ id: string; focusId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, focusId } = await context.params;
  const result = await deleteAdminOrgWeeklyFocus(id, focusId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  const payload = await buildAdminWeeklyFocusPayload(id);
  return NextResponse.json({ success: true, ...payload });
}
