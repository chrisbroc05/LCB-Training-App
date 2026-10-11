import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { deleteCoachNote, updateCoachNote } from "@/lib/coach-note-server";

type RouteContext = { params: Promise<{ enrollmentId: string; noteId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { enrollmentId, noteId } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    body?: string;
    pinned?: boolean;
  } | null;

  try {
    const note = await updateCoachNote(noteId, enrollmentId, {
      body: body?.body,
      pinned: body?.pinned,
    });
    return NextResponse.json({ note });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update note." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { enrollmentId, noteId } = await context.params;

  try {
    await deleteCoachNote(noteId, enrollmentId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete note." },
      { status: 400 },
    );
  }
}
