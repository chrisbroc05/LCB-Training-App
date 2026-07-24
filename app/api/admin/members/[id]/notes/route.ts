import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdminEmail } from "@/lib/admin";
import {
  adminMemberDetailSelect,
  parseAdminNotes,
  serializeAdminMemberDetail,
} from "@/lib/admin-members";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UpdateNotesBody = {
  notes?: unknown;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  let body: UpdateNotesBody;
  try {
    body = (await request.json()) as UpdateNotesBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const notes = parseAdminNotes(body.notes);
  if (notes === undefined) {
    return NextResponse.json({ error: "notes is required." }, { status: 400 });
  }

  if (notes === null) {
    return NextResponse.json({ error: "notes must be a string." }, { status: 400 });
  }

  const existingMember = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingMember) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const trimmedNotes = notes.trim();

  const updatedMember = await prisma.user.update({
    where: { id },
    data: {
      adminNotes: trimmedNotes ? trimmedNotes : null,
    },
    select: adminMemberDetailSelect,
  });

  return NextResponse.json({
    success: true,
    member: serializeAdminMemberDetail(updatedMember),
  });
}
