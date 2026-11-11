import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  previewOrgTeamPickNudge,
  sendOrgTeamPickNudge,
} from "@/lib/org-team-pick-nudge-server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const preview = await previewOrgTeamPickNudge(id);
  if (!preview) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  return NextResponse.json({ preview });
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { confirm?: unknown } = {};
  try {
    body = (await request.json()) as { confirm?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.confirm !== true) {
    return NextResponse.json(
      { error: "Confirm is required. Load the preview first, then send with confirm: true." },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const preview = await previewOrgTeamPickNudge(id);
  if (!preview) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  if (!preview.hasActiveTeams) {
    return NextResponse.json({ error: "This organization has no active teams." }, { status: 400 });
  }

  if (preview.recipients.length === 0) {
    return NextResponse.json({
      preview,
      result: { sent: [], errors: [] },
      message: "No eligible members to remind.",
    });
  }

  const result = await sendOrgTeamPickNudge(id);
  const refreshed = await previewOrgTeamPickNudge(id);

  return NextResponse.json({
    preview: refreshed ?? preview,
    result,
    message: `Sent ${result.sent.length} reminder${result.sent.length === 1 ? "" : "s"}${
      result.errors.length > 0 ? `, ${result.errors.length} error(s)` : ""
    }.`,
  });
}
