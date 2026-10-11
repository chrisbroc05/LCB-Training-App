import "server-only";

import { validateCoachNoteBody } from "@/lib/coach-note-shared";
import { prisma } from "@/lib/prisma";

export async function listCoachNotes(enrollmentId: string) {
  return prisma.coachNote.findMany({
    where: { enrollmentId },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });
}

export async function createCoachNote(enrollmentId: string, body: string) {
  const validated = validateCoachNoteBody(body);
  if (!validated.ok) {
    throw new Error(validated.error);
  }

  return prisma.coachNote.create({
    data: {
      enrollmentId,
      body: validated.body,
    },
  });
}

export async function updateCoachNote(
  noteId: string,
  enrollmentId: string,
  data: { body?: string; pinned?: boolean },
) {
  const update: { body?: string; pinned?: boolean } = {};

  if (data.body !== undefined) {
    const validated = validateCoachNoteBody(data.body);
    if (!validated.ok) {
      throw new Error(validated.error);
    }
    update.body = validated.body;
  }

  if (typeof data.pinned === "boolean") {
    update.pinned = data.pinned;
  }

  const existing = await prisma.coachNote.findFirst({
    where: { id: noteId, enrollmentId },
  });
  if (!existing) {
    throw new Error("Note not found.");
  }

  return prisma.coachNote.update({
    where: { id: noteId },
    data: update,
  });
}

export async function deleteCoachNote(noteId: string, enrollmentId: string) {
  const existing = await prisma.coachNote.findFirst({
    where: { id: noteId, enrollmentId },
  });
  if (!existing) {
    throw new Error("Note not found.");
  }

  await prisma.coachNote.delete({
    where: { id: noteId },
  });
}
