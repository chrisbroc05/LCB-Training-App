import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  combineFullName,
  getGraduationYearOptions,
  isPlayerLevel,
  isPlayerPosition,
  memberProfileSelect,
  splitFullName,
} from "@/lib/player-profile";
import { prisma } from "@/lib/prisma";

type ProfileBody = {
  firstName?: string;
  lastName?: string;
  position?: string;
  age?: number | string | null;
  graduationYear?: number | string | null;
  currentTeam?: string;
  level?: string;
  playerBio?: string;
};

function parseOptionalAge(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 99) {
    return null;
  }

  return parsed;
}

function parseOptionalGraduationYear(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  const allowedYears = getGraduationYearOptions();
  if (!Number.isFinite(parsed) || !allowedYears.includes(parsed)) {
    return null;
  }

  return parsed;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      ...memberProfileSelect,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const { firstName, lastName } = splitFullName(user.name);

  return NextResponse.json({
    profile: {
      firstName,
      lastName,
      position: user.position ?? "",
      age: user.age,
      graduationYear: user.graduationYear,
      currentTeam: user.currentTeam ?? "",
      level: user.level ?? "",
      playerBio: user.playerBio ?? "",
    },
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ProfileBody;
  try {
    body = (await request.json()) as ProfileBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const firstName = body.firstName?.trim() ?? "";
  const lastName = body.lastName?.trim() ?? "";
  const position = body.position?.trim() ?? "";
  const currentTeam = body.currentTeam?.trim() ?? "";
  const level = body.level?.trim() ?? "";
  const playerBio = body.playerBio?.trim() ?? "";
  const age = parseOptionalAge(body.age);
  const graduationYear = parseOptionalGraduationYear(body.graduationYear);

  if (position && !isPlayerPosition(position)) {
    return NextResponse.json({ error: "Please select a valid position." }, { status: 400 });
  }

  if (level && !isPlayerLevel(level)) {
    return NextResponse.json({ error: "Please select a valid level." }, { status: 400 });
  }

  if (body.age !== null && body.age !== undefined && body.age !== "" && age === null) {
    return NextResponse.json({ error: "Please enter a valid age." }, { status: 400 });
  }

  if (
    body.graduationYear !== null &&
    body.graduationYear !== undefined &&
    body.graduationYear !== "" &&
    graduationYear === null
  ) {
    return NextResponse.json({ error: "Please select a valid graduation year." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: combineFullName(firstName, lastName) || null,
      position: position || null,
      age,
      graduationYear,
      currentTeam: currentTeam || null,
      level: level || null,
      playerBio: playerBio || null,
    },
  });

  return NextResponse.json({ success: true, message: "Profile saved" });
}
