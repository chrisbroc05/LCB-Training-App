import { NextResponse } from "next/server";
import { verifyLeadUnsubscribeToken } from "@/lib/lead-unsubscribe-token";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token?.trim();
  if (!token) {
    return NextResponse.json({ error: "Invalid token." }, { status: 400 });
  }

  const leadId = verifyLeadUnsubscribeToken(token);
  if (!leadId) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, userId: true },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  await prisma.lead.update({
    where: { id: lead.id },
    data: { unsubscribedAt: new Date() },
  });

  if (lead.userId) {
    await prisma.user.update({
      where: { id: lead.userId },
      data: {
        notifyAnnouncements: false,
        marketingEmailsSuppressed: true,
      },
    });
  }

  return NextResponse.json({ success: true });
}
