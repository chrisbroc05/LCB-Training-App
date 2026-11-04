import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { loadAdminMemberDetailSerialized } from "@/lib/admin-member-detail-server";
import { updateMemberClubReportExcluded } from "@/lib/admin-org-club-report-server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type Body = {
  excluded?: boolean;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.excluded !== "boolean") {
    return NextResponse.json({ error: "excluded is required." }, { status: 400 });
  }

  await updateMemberClubReportExcluded({ userId: id, excluded: body.excluded });

  const member = await loadAdminMemberDetailSerialized(id);
  if (!member) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  return NextResponse.json({ member });
}
