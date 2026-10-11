import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { createCoachNote, listCoachNotes } from "@/lib/coach-note-server";

type RouteContext = { params: Promise<{ enrollmentId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { enrollmentId } = await context.params;
  const notes = await listCoachNotes(enrollmentId);
  return NextResponse.json({ notes });
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { enrollmentId } = await context.params;
  const body = (await request.json().catch(() => null)) as { body?: string } | null;

  try {
    const note = await createCoachNote(enrollmentId, body?.body ?? "");
    return NextResponse.json({ note });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save note." },
      { status: 400 },
    );
  }
}
