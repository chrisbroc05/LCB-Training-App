import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isDatabaseTier, type DatabaseTier } from "@/lib/membership";
import { sendNewMemberNotification } from "@/lib/notifications";

type SignupBody = {
  name?: string;
  email?: string;
  password?: string;
  selectedMembershipTier?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SignupBody;
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const selectedMembershipTier = body.selectedMembershipTier?.toUpperCase() ?? "BASIC";
    const membershipTierForNotification: DatabaseTier = isDatabaseTier(selectedMembershipTier)
      ? selectedMembershipTier
      : "BASIC";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashedPassword = await hash(password, 12);

    await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashedPassword,
        membershipTier: "BASIC",
      },
    });

    try {
      await sendNewMemberNotification({
        userEmail: email,
        membershipTier: membershipTierForNotification,
      });
    } catch (error) {
      console.error("Failed to send new member notification", error);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create account right now." }, { status: 500 });
  }
}
