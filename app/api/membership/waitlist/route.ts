import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Body = {
  name?: string;
  email?: string;
  note?: string;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const body = (await request.json()) as Body;
  const name = body.name?.trim() || session?.user?.name?.trim();
  const email = body.email?.trim().toLowerCase() || session?.user?.email?.trim().toLowerCase();
  const note = body.note?.trim() || null;

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  await prisma.allAccessWaitlistEntry.create({
    data: {
      name,
      email,
      note,
      userId: session?.user?.id ?? null,
    },
  });

  return NextResponse.json({ success: true });
}
