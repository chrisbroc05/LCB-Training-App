import {
  buildEmailFooterText,
  buildMemberEmailHtml,
  escapeHtml,
} from "@/lib/email-layout";

export const MEDIA_POLICY_UPDATE_EMAIL_SUBJECT =
  "A quick update on photos and videos at LCB Training";

export function buildMediaPolicyUpdateEmailBodyText(recipientFirstName: string) {
  const name = recipientFirstName.trim() || "there";
  return `Hi ${name},

I updated my media policy. Group training videos (team sessions and clinics) are part of the program and may be shared on my social media. Your choice of "No" still means no close-ups, one-on-one clips, or your player's name.

If you'd prefer your player not appear in group videos either, just reply to this email and I'll make sure they're kept out.

Thanks,
Coach Broc`;
}

export function buildMediaPolicyUpdateEmail(params: { recipientFirstName: string }) {
  const name = params.recipientFirstName.trim() || "there";
  const subject = MEDIA_POLICY_UPDATE_EMAIL_SUBJECT;
  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:22px; line-height:1.3; color:#0A1628;">Photos and videos update</h1>
<p style="margin:0 0 12px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">Hi ${escapeHtml(name)},</p>
<p style="margin:0 0 12px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">I updated my media policy. Group training videos (team sessions and clinics) are part of the program and may be shared on my social media. Your choice of &ldquo;No&rdquo; still means no close-ups, one-on-one clips, or your player&apos;s name.</p>
<p style="margin:0 0 12px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">If you&apos;d prefer your player not appear in group videos either, just reply to this email and I&apos;ll make sure they&apos;re kept out.</p>
<p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">Thanks,<br/>Coach Broc</p>`;

  const text = `${buildMediaPolicyUpdateEmailBodyText(name)}

${buildEmailFooterText()}`;

  return {
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml }),
    text,
  };
}

export function mediaPolicyUpdateDedupeKey(normalizedEmail: string) {
  return `media-policy-update:${normalizedEmail}`;
}
