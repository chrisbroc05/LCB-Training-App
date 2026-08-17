import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendAccountDeletionRequestNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

type DeleteAccountRequestBody = {
  confirmEmail?: string;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as DeleteAccountRequestBody;
  const confirmEmail = body.confirmEmail?.trim().toLowerCase();

  if (!confirmEmail) {
    return NextResponse.json({ error: "Email confirmation is required." }, { status: 400 });
  }

  if (confirmEmail !== session.user.email.toLowerCase()) {
    return NextResponse.json(
      { error: "Email confirmation does not match your account email." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      membershipTier: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    await sendAccountDeletionRequestNotification({
      memberName: user.name ?? "Member",
      memberEmail: user.email,
      membershipTier: user.membershipTier,
    });
  } catch (error) {
    console.error("Failed to send account deletion request notification", error);
    return NextResponse.json(
      { error: "Unable to submit deletion request right now." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message:
      "Your deletion request has been sent to Coach Broc. He will follow up with you directly.",
  });
}
