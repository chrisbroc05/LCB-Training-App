import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserLegalStatus } from "@/lib/legal-server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ needsAcceptance: false });
  }

  const status = await getUserLegalStatus(session.user.id);
  if (!status) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json(status);
}
