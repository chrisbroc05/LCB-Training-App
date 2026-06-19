import nodemailer from "nodemailer";
import type { DatabaseTier } from "@/lib/membership";

function createTransporter() {
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!notificationEmail || !emailPassword) {
    throw new Error("NOTIFICATION_EMAIL and EMAIL_PASSWORD are required for notifications.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: notificationEmail,
      pass: emailPassword,
    },
  });
}

function getNotificationRecipient() {
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  if (!notificationEmail) {
    throw new Error("NOTIFICATION_EMAIL is required for notifications.");
  }

  return notificationEmail;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

function getTierLabel(tier: DatabaseTier) {
  return tier.charAt(0) + tier.slice(1).toLowerCase();
}

function getPriorityLabel(tier: DatabaseTier) {
  if (tier === "ELITE") {
    return "High";
  }

  if (tier === "PRO") {
    return "Standard";
  }

  return "Standard";
}

function getLogoUrl() {
  const appUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "");
  return appUrl ? `${appUrl}/logo/lcb-training-logo.png` : "";
}

function buildSubmissionNotificationHtml(params: {
  title: string;
  membershipTier: DatabaseTier;
  userEmail: string;
  detailRows: Array<{ label: string; value: string }>;
}) {
  const priority = getPriorityLabel(params.membershipTier);
  const tierLabel = getTierLabel(params.membershipTier);
  const logoUrl = getLogoUrl();

  const rowMarkup = params.detailRows
    .map(
      (row) => {
        const valueMarkup = isHttpUrl(row.value)
          ? `<a href="${escapeHtml(row.value)}" target="_blank" rel="noopener noreferrer" style="color:#8fd7ff; text-decoration:underline;">${escapeHtml(row.value)}</a>`
          : escapeHtml(row.value);

        return `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #23324f; color: #9ca3af; font-size: 13px; width: 180px;">${escapeHtml(row.label)}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #23324f; color: #f4f4f5; font-size: 13px; white-space: pre-wrap;">${valueMarkup}</td>
        </tr>`;
      },
    )
    .join("");

  return `
    <div style="margin:0; padding:24px; background:#05070d; font-family: Arial, sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 720px; margin: 0 auto; border-collapse: collapse; border: 1px solid #1f2c43; border-radius: 12px; overflow: hidden; background: #0b1324;">
        <tr>
          <td style="background: linear-gradient(90deg, #000000 0%, #0f1d34 70%, #7fbf2f 100%); padding: 20px 24px;">
            ${
              logoUrl
                ? `<img src="${logoUrl}" alt="LCB Training" style="height: 42px; width: auto; display: block; margin-bottom: 12px;" />`
                : ""
            }
            <div style="color: #f4f4f5; font-size: 20px; font-weight: 700;">${escapeHtml(params.title)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 18px 24px; border-bottom: 1px solid #1f2c43;">
            <div style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">Submission Overview</div>
            <div style="color: #f4f4f5; font-size: 14px; line-height: 1.7;">
              <strong style="color:#98b144;">Membership Tier:</strong> ${escapeHtml(tierLabel)}<br/>
              <strong style="color:#98b144;">Priority:</strong> ${escapeHtml(priority)}<br/>
              <strong style="color:#98b144;">Submitting User:</strong> ${escapeHtml(params.userEmail)}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 24px 24px;">
            <div style="color: #f4f4f5; font-size: 14px; font-weight: 600; margin: 18px 0 10px;">Submission Details</div>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid #23324f; border-radius: 8px; overflow: hidden; background: #060b16;">
              ${rowMarkup}
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export async function sendNewMemberNotification(params: {
  userEmail: string;
  membershipTier: DatabaseTier;
}) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: getNotificationRecipient(),
    subject: "New Member Signed Up",
    text: `A new member signed up.\n\nEmail: ${params.userEmail}\nMembership Tier: ${params.membershipTier}`,
  });
}

export async function sendSwingSubmissionNotification(params: {
  userEmail: string;
  membershipTier: DatabaseTier;
  playerName: string;
  pitchType: string;
  handedness: string;
  notes: string;
  responsePreference: "VIDEO_RESPONSE" | "WRITTEN_RESPONSE";
  submittedVideo: string;
}) {
  const transporter = createTransporter();
  const html = buildSubmissionNotificationHtml({
    title: "New Swing Submission",
    membershipTier: params.membershipTier,
    userEmail: params.userEmail,
    detailRows: [
      { label: "Player Name", value: params.playerName },
      { label: "Pitch Type Focus", value: params.pitchType },
      { label: "Handedness", value: params.handedness },
      {
        label: "Preferred Response",
        value:
          params.responsePreference === "VIDEO_RESPONSE"
            ? "Video Response from Coach"
            : "Written Response",
      },
      { label: "Submitted Video", value: params.submittedVideo },
      { label: "Notes", value: params.notes || "No notes provided." },
    ],
  });

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: getNotificationRecipient(),
    subject: "New Swing Submission",
    text: `New Swing Submission\n\nMembership Tier: ${getTierLabel(params.membershipTier)}\nPriority: ${getPriorityLabel(params.membershipTier)}\nSubmitting User: ${params.userEmail}\nPlayer Name: ${params.playerName}\nPitch Type Focus: ${params.pitchType}\nHandedness: ${params.handedness}\nPreferred Response: ${params.responsePreference}\nSubmitted Video: ${params.submittedVideo}\nNotes: ${params.notes || "No notes provided."}`,
    html,
  });
}

export async function sendMentalGameSubmissionNotification(params: {
  userEmail: string;
  membershipTier: DatabaseTier;
  playerName: string;
  playerAge: string;
  topic: string;
  message: string;
  videoPath: string | null;
  responsePreference: string;
  status: string;
}) {
  const transporter = createTransporter();
  const html = buildSubmissionNotificationHtml({
    title: "New Mental Game Submission",
    membershipTier: params.membershipTier,
    userEmail: params.userEmail,
    detailRows: [
      { label: "Player Name", value: params.playerName },
      { label: "Player Age", value: params.playerAge },
      { label: "Topic", value: params.topic },
      {
        label: "Preferred Response",
        value:
          params.responsePreference === "VIDEO_RESPONSE"
            ? "Video Response from Coach"
            : "Written Response",
      },
      { label: "Video", value: params.videoPath ?? "No video uploaded" },
      { label: "Status", value: params.status },
      { label: "Message", value: params.message },
    ],
  });

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: getNotificationRecipient(),
    subject: "New Mental Game Submission",
    text: `New Mental Game Submission\n\nMembership Tier: ${getTierLabel(params.membershipTier)}\nPriority: ${getPriorityLabel(params.membershipTier)}\nSubmitting User: ${params.userEmail}\nPlayer Name: ${params.playerName}\nPlayer Age: ${params.playerAge}\nTopic: ${params.topic}\nMessage: ${params.message}\nVideo: ${params.videoPath ?? "No video uploaded"}\nResponse Preference: ${params.responsePreference}\nStatus: ${params.status}`,
    html,
  });
}

export async function sendSubmissionResponseEmail(params: {
  toEmail: string;
  playerName: string;
  submissionType: "SWING_ANALYSIS" | "MENTAL_GAME";
  responseMode: "VIDEO" | "WRITTEN";
  writtenResponse?: string;
  videoResponseUrl?: string;
}) {
  const transporter = createTransporter();
  const submissionLabel =
    params.submissionType === "SWING_ANALYSIS" ? "swing analysis" : "mental game support";

  const responseBody =
    params.responseMode === "VIDEO"
      ? `Your coach has sent a video response: ${params.videoResponseUrl}`
      : `Your coach has sent a written response:\n\n${params.writtenResponse}`;

  const htmlResponseBody =
    params.responseMode === "VIDEO"
      ? `Your coach has sent a video response: <a href="${escapeHtml(
          params.videoResponseUrl ?? "",
        )}" target="_blank" rel="noopener noreferrer" style="color:#8fd7ff; text-decoration:underline;">${escapeHtml(
          params.videoResponseUrl ?? "",
        )}</a>`
      : `Your coach has sent a written response:<br/><br/>${escapeHtml(params.writtenResponse ?? "")}`;

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: params.toEmail,
    subject: "Your LCB Training Coach Response",
    text: `Hi ${params.playerName},\n\nThanks for your ${submissionLabel} submission.\n\n${responseBody}\n\n-LCB Training`,
    html: `<div style="font-family: Arial, sans-serif; color: #e5e7eb; background: #05070d; padding: 24px;">
      <div style="max-width: 620px; margin: 0 auto; border: 1px solid #1f2c43; border-radius: 12px; overflow: hidden; background: #0b1324;">
        <div style="background: linear-gradient(90deg, #000000 0%, #0f1d34 70%, #7fbf2f 100%); padding: 18px 20px; font-size: 18px; font-weight: 700; color: #f4f4f5;">
          Your LCB Training Coach Response
        </div>
        <div style="padding: 20px; font-size: 14px; line-height: 1.65; color: #e5e7eb;">
          <p style="margin: 0 0 12px;">Hi ${escapeHtml(params.playerName)},</p>
          <p style="margin: 0 0 12px;">Thanks for your ${escapeHtml(submissionLabel)} submission.</p>
          <p style="margin: 0 0 12px;">${htmlResponseBody}</p>
          <p style="margin: 0;">-LCB Training</p>
        </div>
      </div>
    </div>`,
  });
}

export async function sendSubscriptionCancellationEmail(params: {
  toEmail: string;
  displayName: string;
  effectiveEndDate: Date;
}) {
  const transporter = createTransporter();
  const formattedDate = params.effectiveEndDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: params.toEmail,
    subject: "LCB Training Subscription Cancellation Confirmed",
    text: `Hi ${params.displayName},\n\nYour subscription has been canceled and will remain active until ${formattedDate}. After that date, your account will move to Basic membership.\n\nIf this was a mistake, you can re-subscribe any time from your account.\n\n-LCB Training`,
    html: `<div style="font-family: Arial, sans-serif; color: #e5e7eb; background: #05070d; padding: 24px;">
      <div style="max-width: 620px; margin: 0 auto; border: 1px solid #1f2c43; border-radius: 12px; overflow: hidden; background: #0b1324;">
        <div style="background: linear-gradient(90deg, #000000 0%, #0f1d34 70%, #7fbf2f 100%); padding: 18px 20px; font-size: 18px; font-weight: 700; color: #f4f4f5;">
          Subscription Cancellation Confirmed
        </div>
        <div style="padding: 20px; font-size: 14px; line-height: 1.65; color: #e5e7eb;">
          <p style="margin: 0 0 12px;">Hi ${escapeHtml(params.displayName)},</p>
          <p style="margin: 0 0 12px;">Your subscription has been canceled and will remain active until <strong>${escapeHtml(formattedDate)}</strong>.</p>
          <p style="margin: 0 0 12px;">After that date, your account will move to Basic membership.</p>
          <p style="margin: 0;">If this was a mistake, you can re-subscribe any time from your account settings.</p>
        </div>
      </div>
    </div>`,
  });
}
