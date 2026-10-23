import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  buildAdminWeeklyFocusPayload,
  saveAdminOrgWeeklyFocus,
} from "@/lib/org-weekly-focus-admin-server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const url = new URL(request.url);
  const week = url.searchParams.get("week") ?? undefined;

  const payload = await buildAdminWeeklyFocusPayload(id, week ?? undefined);
  return NextResponse.json(payload);
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;
  const weekStartInput = String(body.weekStartDate ?? body.weekStart ?? "").trim();
  if (!weekStartInput) {
    return NextResponse.json(
      { error: "Week is required (Monday date, Chicago time)." },
      { status: 400 },
    );
  }

  const result = await saveAdminOrgWeeklyFocus({
    organizationId: id,
    focusId: body.focusId ? String(body.focusId) : null,
    weekStartInput,
    orgTeamId: body.orgTeamId ? String(body.orgTeamId) : null,
    title: String(body.title ?? ""),
    notes: body.notes != null ? String(body.notes) : null,
    drillIds: body.drillIds,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const payload = await buildAdminWeeklyFocusPayload(id, weekStartInput);
  return NextResponse.json({ success: true, message: "Saved", ...payload });
}
