import { NextResponse } from "next/server";
import { verifyMarketingUnsubscribeToken } from "@/lib/marketing-unsubscribe-token";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token?.trim();

  if (!token) {
    return NextResponse.json({ error: "Invalid token." }, { status: 400 });
  }

  const userId = verifyMarketingUnsubscribeToken(token);
  if (!userId) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { notifyAnnouncements: false },
  });

  return NextResponse.json({ success: true });
}
