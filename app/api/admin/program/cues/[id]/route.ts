import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    label?: string;
    drillIds?: string[];
    archived?: boolean;
  } | null;

  const existing = await prisma.coachCue.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Cue not found." }, { status: 404 });
  }

  const data: {
    label?: string;
    drillIds?: string[];
    archived?: boolean;
  } = {};

  if (typeof body?.label === "string") {
    const trimmed = body.label.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Label is required." }, { status: 400 });
    }
    data.label = trimmed;
  }

  if (Array.isArray(body?.drillIds)) {
    data.drillIds = body.drillIds.filter(Boolean);
  }

  if (typeof body?.archived === "boolean") {
    data.archived = body.archived;
  }

  const cue = await prisma.coachCue.update({
    where: { id },
    data,
  });

  return NextResponse.json({ cue });
}
