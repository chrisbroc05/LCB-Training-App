import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolvePostAuthDestination } from "@/lib/post-auth-redirect";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ path: "/auth" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const redirectParam = searchParams.get("redirect");
  const callbackUrlParam = searchParams.get("callbackUrl");
  const path = await resolvePostAuthDestination(
    session.user.id,
    redirectParam,
    callbackUrlParam,
  );

  return NextResponse.json({ path });
}
