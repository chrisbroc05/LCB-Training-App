import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { buildAdminProgramOverview } from "@/lib/admin-program-overview";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const showTestAccounts = searchParams.get("showTestAccounts") === "true";
  const overview = await buildAdminProgramOverview(new Date(), { showTestAccounts });
  return NextResponse.json(overview);
}
