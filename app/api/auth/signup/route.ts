import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { DatabaseTier } from "@/lib/membership";

type SignupBody = {
  name?: string;
  email?: string;
  password?: string;
  membershipTier?: DatabaseTier;
};

const validTiers: DatabaseTier[] = ["BASIC", "PRO", "ELITE"];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SignupBody;
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const membershipTier = body.membershipTier;

    if (!email || !password || !membershipTier) {
      return NextResponse.json(
        { error: "Email, password, and membership tier are required." },
        { status: 400 },
      );
    }

    if (!validTiers.includes(membershipTier)) {
      return NextResponse.json({ error: "Invalid membership tier selected." }, { status: 400 });
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
        membershipTier,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create account right now." }, { status: 500 });
  }
}
