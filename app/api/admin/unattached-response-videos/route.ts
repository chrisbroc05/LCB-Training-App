import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { listUnattachedAdminResponseVideos } from "@/lib/admin-unattached-response-videos-server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const daysParam = searchParams.get("days");
  let since: Date | undefined;
  if (daysParam && daysParam !== "all") {
    const days = Number(daysParam);
    if (Number.isFinite(days) && days > 0) {
      since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }
  }

  const videos = await listUnattachedAdminResponseVideos({ since });
  return NextResponse.json({ videos });
}
