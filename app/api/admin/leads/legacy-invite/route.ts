import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  previewLegacyLeadInviteCampaign,
  sendLegacyLeadInviteCampaign,
} from "@/lib/admin-lead-legacy-invite-server";
import { isAdminEmail } from "@/lib/admin";

type Body = {
  action?: "preview" | "send";
  confirm?: boolean;
  limit?: number;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;

  if (body.action === "preview" || !body.action) {
    const preview = await previewLegacyLeadInviteCampaign();
    return NextResponse.json({ preview });
  }

  if (body.action === "send") {
    if (!body.confirm) {
      return NextResponse.json(
        { error: "Pass confirm: true after previewing the legacy lead campaign." },
        { status: 400 },
      );
    }

    const result = await sendLegacyLeadInviteCampaign({ limit: body.limit });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
