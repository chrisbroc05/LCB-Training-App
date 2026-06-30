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

  if (tier === "BASIC") {
    return "Standard";
  }

  return "Free";
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
  videoAttachment?: {
    fileName: string;
    content: Buffer;
    contentType: string;
  };
  temporaryVideoLink?: string;
  temporaryVideoLinkExpiresAt?: Date;
}) {
  const transporter = createTransporter();
  const attachmentSummary = params.videoAttachment
    ? `Attached file: ${params.videoAttachment.fileName}`
    : "No attached file";
  const tempLinkSummary = params.temporaryVideoLink ?? "Not provided";
  const tempLinkExpiry = params.temporaryVideoLinkExpiresAt
    ? params.temporaryVideoLinkExpiresAt.toLocaleString()
    : "Not provided";

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
      { label: "Submitted Video Reference", value: params.submittedVideo },
      { label: "Attached Video", value: attachmentSummary },
      { label: "Temporary Download Link", value: tempLinkSummary },
      { label: "Temporary Link Expires", value: tempLinkExpiry },
      { label: "Notes", value: params.notes || "No notes provided." },
    ],
  });

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: getNotificationRecipient(),
    subject: "New Swing Submission",
    text: `New Swing Submission\n\nMembership Tier: ${getTierLabel(params.membershipTier)}\nPriority: ${getPriorityLabel(params.membershipTier)}\nSubmitting User: ${params.userEmail}\nPlayer Name: ${params.playerName}\nPitch Type Focus: ${params.pitchType}\nHandedness: ${params.handedness}\nPreferred Response: ${params.responsePreference}\nSubmitted Video Reference: ${params.submittedVideo}\nAttached Video: ${attachmentSummary}\nTemporary Download Link: ${tempLinkSummary}\nTemporary Link Expires: ${tempLinkExpiry}\nNotes: ${params.notes || "No notes provided."}`,
    html,
    attachments: params.videoAttachment
      ? [
          {
            filename: params.videoAttachment.fileName,
            content: params.videoAttachment.content,
            contentType: params.videoAttachment.contentType,
          },
        ]
      : undefined,
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
  videoAttachment?: {
    fileName: string;
    content: Buffer;
    contentType: string;
  };
  temporaryVideoLink?: string;
  temporaryVideoLinkExpiresAt?: Date;
}) {
  const transporter = createTransporter();
  const attachmentSummary = params.videoAttachment
    ? `Attached file: ${params.videoAttachment.fileName}`
    : "No attached file";
  const tempLinkSummary = params.temporaryVideoLink ?? "Not provided";
  const tempLinkExpiry = params.temporaryVideoLinkExpiresAt
    ? params.temporaryVideoLinkExpiresAt.toLocaleString()
    : "Not provided";
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
      { label: "Video Reference", value: params.videoPath ?? "No video uploaded" },
      { label: "Attached Video", value: attachmentSummary },
      { label: "Temporary Download Link", value: tempLinkSummary },
      { label: "Temporary Link Expires", value: tempLinkExpiry },
      { label: "Status", value: params.status },
      { label: "Message", value: params.message },
    ],
  });

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: getNotificationRecipient(),
    subject: "New Mental Game Submission",
    text: `New Mental Game Submission\n\nMembership Tier: ${getTierLabel(params.membershipTier)}\nPriority: ${getPriorityLabel(params.membershipTier)}\nSubmitting User: ${params.userEmail}\nPlayer Name: ${params.playerName}\nPlayer Age: ${params.playerAge}\nTopic: ${params.topic}\nMessage: ${params.message}\nVideo Reference: ${params.videoPath ?? "No video uploaded"}\nAttached Video: ${attachmentSummary}\nTemporary Download Link: ${tempLinkSummary}\nTemporary Link Expires: ${tempLinkExpiry}\nResponse Preference: ${params.responsePreference}\nStatus: ${params.status}`,
    html,
    attachments: params.videoAttachment
      ? [
          {
            filename: params.videoAttachment.fileName,
            content: params.videoAttachment.content,
            contentType: params.videoAttachment.contentType,
          },
        ]
      : undefined,
  });
}

export async function sendSubmissionResponseEmail(params: {
  toEmail: string;
  playerName: string;
  submissionType: "SWING_ANALYSIS" | "MENTAL_GAME";
  responseMode: "VIDEO" | "WRITTEN";
  membershipTier?: DatabaseTier;
  writtenResponse?: string;
  videoResponseUrl?: string;
  videoAttachment?: {
    fileName: string;
    content: Buffer;
    contentType: string;
  };
  videoDownloadLink?: string;
}) {
  const transporter = createTransporter();
  const submissionLabel =
    params.submissionType === "SWING_ANALYSIS" ? "swing analysis" : "mental game support";

  const videoBodyLines = [
    params.videoResponseUrl ? `Video response: ${params.videoResponseUrl}` : "",
    params.videoAttachment ? `Attached video file: ${params.videoAttachment.fileName}` : "",
    params.videoDownloadLink ? `Download video: ${params.videoDownloadLink}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const responseBody =
    params.responseMode === "VIDEO"
      ? `Your coach has sent a video response.\n${videoBodyLines}`
      : `Your coach has sent a written response:\n\n${params.writtenResponse}`;

  const htmlResponseBody =
    params.responseMode === "VIDEO"
      ? `<p style="margin:0 0 8px;">Your coach has sent a video response.</p>
        ${
          params.videoResponseUrl
            ? `<p style="margin:0 0 8px;">Watch online: <a href="${escapeHtml(
                params.videoResponseUrl,
              )}" target="_blank" rel="noopener noreferrer" style="color:#8fd7ff; text-decoration:underline;">${escapeHtml(
                params.videoResponseUrl,
              )}</a></p>`
            : ""
        }
        ${
          params.videoAttachment
            ? `<p style="margin:0 0 8px;">Attached video file: ${escapeHtml(params.videoAttachment.fileName)}</p>`
            : ""
        }
        ${
          params.videoDownloadLink
            ? `<p style="margin:0;">Download video: <a href="${escapeHtml(
                params.videoDownloadLink,
              )}" target="_blank" rel="noopener noreferrer" style="color:#8fd7ff; text-decoration:underline;">${escapeHtml(
                params.videoDownloadLink,
              )}</a></p>`
            : ""
        }`
      : `Your coach has sent a written response:<br/><br/>${escapeHtml(params.writtenResponse ?? "")}`;
  const settingsUrl = `${process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000"}/settings`;
  const isFreeTier = params.membershipTier === "FREE";
  const freeTierCtaText = isFreeTier
    ? `Want to keep progressing?

Basic ($5/month) unlocks the full hitting, fielding, and mindset libraries.
Pro ($9/month) unlocks ongoing swing analysis feedback plus mental game support.
Upgrade now in Settings: ${settingsUrl}
`
    : "";
  const freeTierCtaHtml = isFreeTier
    ? `<div style="margin-top:16px; padding:12px; border:1px solid #2b3650; border-radius:10px; background:#060b16;">
        <p style="margin:0 0 8px; font-weight:700; color:#98b144;">Keep building your progress</p>
        <p style="margin:0 0 6px;"><strong>Basic ($5/month):</strong> Full hitting, fielding, and mindset video libraries.</p>
        <p style="margin:0;"><strong>Pro ($9/month):</strong> Ongoing swing analysis feedback and mental game support.</p>
        <p style="margin:8px 0 0;"><a href="${escapeHtml(
          settingsUrl,
        )}" target="_blank" rel="noopener noreferrer" style="color:#8fd7ff; text-decoration:underline;">Upgrade your membership in Settings</a></p>
      </div>`
    : "";
  const generalSettingsCtaText = `Manage your membership and upgrades: ${settingsUrl}`;
  const generalSettingsCtaHtml = `<p style="margin: 12px 0 0;"><a href="${escapeHtml(
    settingsUrl,
  )}" target="_blank" rel="noopener noreferrer" style="color:#8fd7ff; text-decoration:underline;">Manage or upgrade your membership in Settings</a></p>`;

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: params.toEmail,
    subject: "Your LCB Training Coach Response",
    text: `Hi ${params.playerName},\n\nThanks for your ${submissionLabel} submission.\n\n${responseBody}\n${freeTierCtaText}\n${generalSettingsCtaText}\n\n-LCB Training`,
    html: `<div style="font-family: Arial, sans-serif; color: #e5e7eb; background: #05070d; padding: 24px;">
      <div style="max-width: 620px; margin: 0 auto; border: 1px solid #1f2c43; border-radius: 12px; overflow: hidden; background: #0b1324;">
        <div style="background: linear-gradient(90deg, #000000 0%, #0f1d34 70%, #7fbf2f 100%); padding: 18px 20px; font-size: 18px; font-weight: 700; color: #f4f4f5;">
          Your LCB Training Coach Response
        </div>
        <div style="padding: 20px; font-size: 14px; line-height: 1.65; color: #e5e7eb;">
          <p style="margin: 0 0 12px;">Hi ${escapeHtml(params.playerName)},</p>
          <p style="margin: 0 0 12px;">Thanks for your ${escapeHtml(submissionLabel)} submission.</p>
          <p style="margin: 0 0 12px;">${htmlResponseBody}</p>
          ${freeTierCtaHtml}
          ${generalSettingsCtaHtml}
          <p style="margin: 12px 0 0;">-LCB Training</p>
        </div>
      </div>
    </div>`,
    attachments: params.videoAttachment
      ? [
          {
            filename: params.videoAttachment.fileName,
            content: params.videoAttachment.content,
            contentType: params.videoAttachment.contentType,
          },
        ]
      : undefined,
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

export async function sendPaymentFailedEmail(params: {
  toEmail: string;
  displayName: string;
  amountDueCents?: number | null;
  currency?: string | null;
  invoiceUrl?: string | null;
}) {
  const transporter = createTransporter();
  const amountDue =
    typeof params.amountDueCents === "number"
      ? `${(params.amountDueCents / 100).toFixed(2)} ${(params.currency ?? "USD").toUpperCase()}`
      : "your subscription amount";
  const invoiceLink = params.invoiceUrl?.trim() ?? "";

  const textBody = `Hi ${params.displayName},

We couldn't process your latest subscription payment for ${amountDue}.

Please update your billing information as soon as possible to avoid interruption to your LCB Training access.
${invoiceLink ? `\nInvoice link: ${invoiceLink}` : ""}

-LCB Training`;

  const htmlInvoice = invoiceLink
    ? `<p style="margin: 0 0 12px;"><a href="${escapeHtml(
        invoiceLink,
      )}" target="_blank" rel="noopener noreferrer" style="color:#8fd7ff; text-decoration:underline;">View Invoice</a></p>`
    : "";

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: params.toEmail,
    subject: "Payment Failed - Update Billing Information",
    text: textBody,
    html: `<div style="font-family: Arial, sans-serif; color: #e5e7eb; background: #05070d; padding: 24px;">
      <div style="max-width: 620px; margin: 0 auto; border: 1px solid #1f2c43; border-radius: 12px; overflow: hidden; background: #0b1324;">
        <div style="background: linear-gradient(90deg, #000000 0%, #0f1d34 70%, #7fbf2f 100%); padding: 18px 20px; font-size: 18px; font-weight: 700; color: #f4f4f5;">
          Payment Failed
        </div>
        <div style="padding: 20px; font-size: 14px; line-height: 1.65; color: #e5e7eb;">
          <p style="margin: 0 0 12px;">Hi ${escapeHtml(params.displayName)},</p>
          <p style="margin: 0 0 12px;">We could not process your latest subscription payment for <strong>${escapeHtml(
            amountDue,
          )}</strong>.</p>
          <p style="margin: 0 0 12px;">Please update your billing information as soon as possible to avoid interruption to your LCB Training access.</p>
          ${htmlInvoice}
          <p style="margin: 0;">-LCB Training</p>
        </div>
      </div>
    </div>`,
  });
}

export async function sendMembershipTierChangeEmail(params: {
  toEmail: string;
  displayName: string;
  newTier: DatabaseTier;
}) {
  const transporter = createTransporter();
  const tierLabel = getTierLabel(params.newTier);

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: params.toEmail,
    subject: "Your Membership Tier Has Been Updated",
    text: `Hi ${params.displayName},\n\nYour LCB Training membership has been updated to ${tierLabel}. Any prorated Stripe adjustment has been applied automatically.\n\n-LCB Training`,
    html: `<div style="font-family: Arial, sans-serif; color: #e5e7eb; background: #05070d; padding: 24px;">
      <div style="max-width: 620px; margin: 0 auto; border: 1px solid #1f2c43; border-radius: 12px; overflow: hidden; background: #0b1324;">
        <div style="background: linear-gradient(90deg, #000000 0%, #0f1d34 70%, #7fbf2f 100%); padding: 18px 20px; font-size: 18px; font-weight: 700; color: #f4f4f5;">
          Membership Updated
        </div>
        <div style="padding: 20px; font-size: 14px; line-height: 1.65; color: #e5e7eb;">
          <p style="margin: 0 0 12px;">Hi ${escapeHtml(params.displayName)},</p>
          <p style="margin: 0 0 12px;">Your LCB Training membership has been updated to <strong>${escapeHtml(
            tierLabel,
          )}</strong>.</p>
          <p style="margin: 0;">Any prorated Stripe adjustment has been applied automatically.</p>
        </div>
      </div>
    </div>`,
  });
}

function getLoginUrl() {
  const appUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "");
  return appUrl ? `${appUrl}/auth` : "http://localhost:3000/auth";
}

function buildOnboardingEmailShell(params: {
  heading: string;
  intro: string;
  bodyHtml: string;
}) {
  const logoUrl = getLogoUrl();

  return `<div style="font-family: Arial, sans-serif; color: #e5e7eb; background: #05070d; padding: 24px;">
    <div style="max-width: 700px; margin: 0 auto; border: 1px solid #1f2c43; border-radius: 12px; overflow: hidden; background: #0b1324;">
      <div style="background: linear-gradient(90deg, #000000 0%, #0f1d34 70%, #7fbf2f 100%); padding: 20px 24px;">
        ${
          logoUrl
            ? `<img src="${logoUrl}" alt="LCB Training" style="height: 42px; width: auto; display: block; margin-bottom: 12px;" />`
            : ""
        }
        <div style="font-size: 20px; font-weight: 700; color: #f4f4f5;">${escapeHtml(params.heading)}</div>
      </div>
      <div style="padding: 22px 24px; font-size: 14px; line-height: 1.7; color: #e5e7eb;">
        <p style="margin: 0 0 14px;">${params.intro}</p>
        ${params.bodyHtml}
      </div>
    </div>
  </div>`;
}

export async function sendOnboardingEmail1(params: {
  toEmail: string;
  displayName: string;
  membershipTier: DatabaseTier;
}) {
  const transporter = createTransporter();
  const tierLabel = getTierLabel(params.membershipTier);
  const loginUrl = getLoginUrl();
  const introVideosText = "Start by watching the intro videos so you can learn the training flow.";
  const dashboardGuidance =
    params.membershipTier === "FREE"
      ? "You currently have one free submission total (swing analysis or mental game support). Use it when you are ready for focused feedback."
      : params.membershipTier === "BASIC"
      ? "You currently have access to the hitting, fielding, and mindset libraries. Use your dashboard to build a weekly routine."
      : "You currently have full libraries plus coaching submission tools. Use your dashboard to access swing analysis and mental game support.";

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: params.toEmail,
    subject: "Welcome to LCB Training!",
    text: `Hi ${params.displayName},

Welcome to LCB Training!

${introVideosText}
${dashboardGuidance}

Current membership: ${tierLabel}
Log in: ${loginUrl}

-LCB Training`,
    html: buildOnboardingEmailShell({
      heading: "Welcome to LCB Training!",
      intro: `Hi ${escapeHtml(params.displayName)}, welcome aboard.`,
      bodyHtml: `<p style="margin: 0 0 12px;">${escapeHtml(introVideosText)}</p>
        <p style="margin: 0 0 12px;">${escapeHtml(dashboardGuidance)}</p>
        <p style="margin: 0 0 16px;"><strong style="color:#98b144;">Current Membership:</strong> ${escapeHtml(
          tierLabel,
        )}</p>
        <a href="${escapeHtml(
          loginUrl,
        )}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background:#22c55e; color:#0a0a0a; text-decoration:none; font-weight:700; padding:10px 16px; border-radius:999px;">Log In to Your Dashboard</a>`,
    }),
  });
}

export async function sendOnboardingEmail2(params: {
  toEmail: string;
  displayName: string;
}) {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: params.toEmail,
    subject: "Have you checked out the drill library?",
    text: `Hi ${params.displayName},

Have you checked out the drill library?

Take a look at the hitting and fielding video libraries and pick one drill to focus on this week.
Also make time for the mindset library to strengthen confidence and game focus.

-LCB Training`,
    html: buildOnboardingEmailShell({
      heading: "Have you checked out the drill library?",
      intro: `Hi ${escapeHtml(params.displayName)}, quick check-in from the LCB Training team.`,
      bodyHtml: `<p style="margin: 0 0 12px;">Take a look at the hitting and fielding video libraries and choose one drill to focus on this week.</p>
        <p style="margin: 0;">Also make time for the mindset library to strengthen confidence, focus, and in-game composure.</p>`,
    }),
  });
}

export async function sendOnboardingEmail3(params: {
  toEmail: string;
  displayName: string;
  membershipTier: DatabaseTier;
}) {
  const transporter = createTransporter();
  const isAdvancedTier = params.membershipTier === "PRO" || params.membershipTier === "ELITE";
  const message = isAdvancedTier
    ? "You have swing analysis and mental game support available right now. Submit your first video this week and start getting personalized coaching feedback."
    : "Ready for personalized feedback? Upgrade to Pro or Elite to unlock swing analysis and mental game support submissions.";

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: params.toEmail,
    subject: "Time to put your skills to the test!",
    text: `Hi ${params.displayName},

Time to put your skills to the test!

${message}

-LCB Training`,
    html: buildOnboardingEmailShell({
      heading: "Time to put your skills to the test!",
      intro: `Hi ${escapeHtml(params.displayName)}, you are one week in.`,
      bodyHtml: `<p style="margin: 0;">${escapeHtml(message)}</p>`,
    }),
  });
}
