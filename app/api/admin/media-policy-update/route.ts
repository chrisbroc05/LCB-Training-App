import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  buildMediaPolicyUpdateEmail,
  MEDIA_POLICY_UPDATE_EMAIL_SUBJECT,
  buildMediaPolicyUpdateEmailBodyText,
} from "@/lib/media-policy-update-email-shared";
import {
  listMediaPolicyUpdateRecipients,
  sendMediaPolicyUpdateEmails,
} from "@/lib/media-policy-update-email-server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const recipients = await listMediaPolicyUpdateRecipients();
  const sample = buildMediaPolicyUpdateEmail({ recipientFirstName: "Alex" });

  return NextResponse.json({
    recipientCount: recipients.length,
    subject: MEDIA_POLICY_UPDATE_EMAIL_SUBJECT,
    sampleText: buildMediaPolicyUpdateEmailBodyText("Alex"),
    sampleHtml: sample.html,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { confirm?: boolean };
  if (body.confirm !== true) {
    return NextResponse.json({ error: "Set confirm: true to send." }, { status: 400 });
  }

  const result = await sendMediaPolicyUpdateEmails();
  return NextResponse.json({
    sent: result.sent,
    recipientCount: result.recipients.length,
  });
}
