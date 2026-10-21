import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import type { DatabaseTier } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { getPrivateResourceAbsolutePath } from "@/lib/resource-files-server";
import { getWorkoutResource, canAccessWorkoutResourceFile } from "@/lib/workout-resources";

type RouteContext = {
  params: Promise<{
    filename: string;
  }>;
};

function getWorkoutResourcePdfPath(filename: string) {
  return getPrivateResourceAbsolutePath(`guides/${filename}`);
}

export async function GET(_request: Request, context: RouteContext) {
  const { filename } = await context.params;
  const resource = getWorkoutResource(filename);

  if (!resource) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminEmail(session.user.email)) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { membershipTier: true, playbookLegacyAccess: true },
    });
    const membershipTier = (user?.membershipTier ?? "FREE") as DatabaseTier;

    if (
      !canAccessWorkoutResourceFile(
        {
          membershipTier,
          playbookLegacyAccess: user?.playbookLegacyAccess ?? false,
        },
        filename,
      )
    ) {
      return NextResponse.json({ error: "Membership upgrade required." }, { status: 403 });
    }
  }

  const filePath = getWorkoutResourcePdfPath(filename);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Resource file not found." }, { status: 404 });
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
