import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  excludeLegacyLeadFromMarketing,
  previewLegacyLeadInviteCampaign,
  sendLegacyLeadInviteCampaign,
} from "@/lib/admin-lead-legacy-invite-server";
import { isAdminEmail } from "@/lib/admin";

type Body = {
  action?: "preview" | "send" | "exclude";
  confirm?: boolean;
  leadIds?: string[];
  leadId?: string;
  reason?: string;
  listLimit?: number;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;

  if (body.action === "preview" || !body.action) {
    const preview = await previewLegacyLeadInviteCampaign({ listLimit: body.listLimit });
    return NextResponse.json({ preview });
  }

  if (body.action === "exclude") {
    if (!body.leadId?.trim()) {
      return NextResponse.json({ error: "leadId is required." }, { status: 400 });
    }
    const lead = await excludeLegacyLeadFromMarketing({
      leadId: body.leadId.trim(),
      reason: body.reason,
    });
    return NextResponse.json({ ok: true, lead });
  }

  if (body.action === "send") {
    if (!body.confirm) {
      return NextResponse.json(
        { error: "Pass confirm: true after previewing the legacy lead campaign." },
        { status: 400 },
      );
    }

    const result = await sendLegacyLeadInviteCampaign({
      leadIds: body.leadIds ?? [],
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
