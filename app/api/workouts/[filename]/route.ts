import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { canAccessWorkoutPrograms, type DatabaseTier } from "@/lib/membership";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    filename: string;
  }>;
};

const allowedFilenames = new Set([
  "LCB_Strength_8-11_Phase1.pdf",
  "LCB_Strength_8-11_Phase2.pdf",
  "LCB_Strength_8-11_Phase3.pdf",
  "LCB_Strength_12-15_Phase1.pdf",
  "LCB_Strength_12-15_Phase2.pdf",
  "LCB_Strength_12-15_Phase3.pdf",
  "LCB_Strength_16-18_Phase1.pdf",
  "LCB_Strength_16-18_Phase2.pdf",
  "LCB_Strength_16-18_Phase3.pdf",
  "LCB_Speed-Agility_8-11_Phase1.pdf",
  "LCB_Speed-Agility_8-11_Phase2.pdf",
  "LCB_Speed-Agility_8-11_Phase3.pdf",
  "LCB_Speed-Agility_12-15_Phase1.pdf",
  "LCB_Speed-Agility_12-15_Phase2.pdf",
  "LCB_Speed-Agility_12-15_Phase3.pdf",
  "LCB_Speed-Agility_16-18_Phase1.pdf",
  "LCB_Speed-Agility_16-18_Phase2.pdf",
  "LCB_Speed-Agility_16-18_Phase3.pdf",
  "LCB_Mobility_8-11.pdf",
  "LCB_Mobility_12-15.pdf",
  "LCB_Mobility_16-18.pdf",
  "LCB_Strength_8-11.pdf",
  "LCB_Strength_12-15.pdf",
  "LCB_Strength_16-18.pdf",
  "LCB_Speed-Agility_8-11.pdf",
  "LCB_Speed-Agility_12-15.pdf",
  "LCB_Speed-Agility_16-18.pdf",
]);

function getWorkoutPdfPath(filename: string) {
  const privatePath = path.join(process.cwd(), "private", "workouts", filename);
  if (existsSync(privatePath)) {
    return privatePath;
  }

  return path.join(process.cwd(), "public", "workouts", filename);
}

export async function GET(_request: Request, context: RouteContext) {
  const { filename } = await context.params;
  if (!allowedFilenames.has(filename)) {
    return NextResponse.json({ error: "Workout file not found." }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminEmail(session.user.email)) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { membershipTier: true },
    });
    const membershipTier = (user?.membershipTier ?? "FREE") as DatabaseTier;

    if (!canAccessWorkoutPrograms(membershipTier)) {
      return NextResponse.json({ error: "Basic membership required." }, { status: 403 });
    }
  }

  const filePath = getWorkoutPdfPath(filename);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Workout file not found." }, { status: 404 });
  }

  const fileBuffer = await readFile(filePath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
