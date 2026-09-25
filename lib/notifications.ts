import nodemailer from "nodemailer";
import {
  buildDrillLibraryUrl,
  buildEmailButton,
  buildEmailDivider,
  buildEmailFooterText,
  buildEmailInfoBox,
  buildEmailNonMemberUpsellHtml,
  buildEmailNonMemberUpsellText,
  buildEmailSectionLabel,
  buildMemberEmailHtml,
  buildSubmissionResponseUrl,
  EMAIL_REPLY_TO,
  escapeHtml,
  getPublicAppUrl,
} from "@/lib/email-layout";
import { getDrillLibraryVideoId, getDrillLibraryVideosByIds } from "@/lib/drill-library-videos";
import type { DatabaseTier } from "@/lib/membership";
import { formatDatabaseTierLabel } from "@/lib/membership";

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

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

function getTierLabel(tier: DatabaseTier) {
  return formatDatabaseTierLabel(tier);
}

function getPriorityLabel(tier: DatabaseTier) {
  if (tier === "ELITE") {
    return "High";
  }

  if (tier === "MEMORABLE") {
    return "Standard";
  }

  if (tier === "BASIC" || tier === "TWELVE_WEEK") {
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

type SubmissionConfirmationType = "SWING" | "MENTAL";

function truncateSubmissionNotes(notes: string, maxLength = 300) {
  const trimmed = notes.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength)}...`;
}

function formatSubmittedAtChicago(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("weekday")}, ${get("month")} ${get("day")} at ${get("hour")}:${get("minute")} ${get("dayPeriod")}`;
}

function buildSubmissionConfirmationEmailContent(params: {
  firstName: string;
  submissionType: SubmissionConfirmationType;
  playerNotes: string;
  isTwelveWeekEnrolled: boolean;
  submittedAt: Date;
}) {
  const trimmedFirstName = params.firstName.trim();
  const hasFirstName = trimmedFirstName.length > 0;
  const isSwing = params.submissionType === "SWING";
  const submissionLabel = isSwing ? "Swing Analysis" : "Mental Game";
  const submissionKind = isSwing ? "swing video" : "mental game question";
  const profileUrl = `${getPublicAppUrl()}/profile`;
  const programUrl = `${getPublicAppUrl()}/program`;
  const submittedAtLabel = formatSubmittedAtChicago(params.submittedAt);
  const notes = truncateSubmissionNotes(params.playerNotes);
  const headline = hasFirstName
    ? `Got it, ${trimmedFirstName}. I'm on it.`
    : "Got it. I'm on it.";
  const subject = hasFirstName
    ? isSwing
      ? `Got your video, ${trimmedFirstName}. I'm on it.`
      : `Got your question, ${trimmedFirstName}. I'm on it.`
    : isSwing
      ? "Got your video. I'm on it."
      : "Got your question. I'm on it.";

  const whatHappensNextHtml = isSwing
    ? `<ol style="margin:0; padding-left:20px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">
        <li style="margin:0 0 8px 0; color:#0A1628;">I watch your video, more than once.</li>
        <li style="margin:0 0 8px 0; color:#0A1628;">I record a video breakdown talking you through exactly what I see.</li>
        <li style="margin:0; color:#0A1628;">You get drills from my library picked for what you need most.</li>
      </ol>`
    : `<ol style="margin:0; padding-left:20px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">
        <li style="margin:0 0 8px 0; color:#0A1628;">I read your question carefully.</li>
        <li style="margin:0 0 8px 0; color:#0A1628;">I record a personal response for you.</li>
        <li style="margin:0; color:#0A1628;">You get tools and drills to put it into action.</li>
      </ol>`;

  const whatHappensNextText = isSwing
    ? "1. I watch your video, more than once.\n2. I record a video breakdown talking you through exactly what I see.\n3. You get drills from my library picked for what you need most."
    : "1. I read your question carefully.\n2. I record a personal response for you.\n3. You get tools and drills to put it into action.";

  const notesHtml = notes
    ? `<tr>
        <td style="padding:6px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; color:#0A1628; white-space:pre-wrap;"><strong style="color:#0A1628;">Your notes:</strong> ${escapeHtml(notes)}</td>
      </tr>`
    : "";

  const notesText = notes ? `\nYour notes: ${notes}` : "";

  const upsellSectionsHtml = params.isTwelveWeekEnrolled
    ? ""
    : buildEmailNonMemberUpsellHtml({ programPitchVariant: "confirmation", programUrl });

  const upsellSectionsText = params.isTwelveWeekEnrolled
    ? ""
    : buildEmailNonMemberUpsellText({ programPitchVariant: "confirmation", programUrl });

  const submissionRecapHtml = buildEmailInfoBox(`<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                    <tr>
                      <td style="padding:6px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; color:#0A1628;"><strong style="color:#0A1628;">Type:</strong> ${escapeHtml(submissionLabel)}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; color:#0A1628;"><strong style="color:#0A1628;">Submitted:</strong> ${escapeHtml(submittedAtLabel)}</td>
                    </tr>
                    ${notesHtml}
                  </table>
                  ${buildEmailButton("View in Your Dashboard", profileUrl)}`);

  const bodyContentHtml = `<h1 style="margin:0 0 20px 0; font-family:Arial, Helvetica, sans-serif; font-size:28px; line-height:1.3; font-weight:700; color:#0A1628;">${escapeHtml(headline)}</h1>
              <p style="margin:0 0 24px 0; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:1.7; color:#0A1628;">Your ${escapeHtml(submissionKind)} just landed with me. I watch every submission myself, no assistants, no shortcuts. You'll have my personal breakdown within 48 hours.</p>
              ${buildEmailSectionLabel("YOUR SUBMISSION")}
              ${submissionRecapHtml}
              ${buildEmailSectionLabel("WHAT HAPPENS NEXT")}
              ${whatHappensNextHtml}
              ${buildEmailSectionLabel("WHILE YOU WAIT")}
              <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">Don't wait on me to get better. Go get 50 good swings today. The players who improve fastest are the ones who work when nobody's watching.</p>
              ${buildEmailSectionLabel("QUICK TIP")}
              <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">Filming another video? Shoot from the side at about hip height with your whole body in frame. 1080p is plenty, and it uploads a lot faster than 4K.</p>
              ${buildEmailDivider()}
              ${buildEmailSectionLabel("WHY I COACH THIS WAY")}
              <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">When I was 13, an opposing coach told my dad he remembered me. Not for a big game, but because I hustled down the line on a routine ground ball and was standing on second on a routine pop-up. Effort is a skill, and it's the kind that gets you remembered. So here's the question I ask every player I work with: what do you want to be known for?</p>
              ${upsellSectionsHtml}`;

  const html = buildMemberEmailHtml({ title: subject, bodyContentHtml });

  const text = `${headline}

Your ${submissionKind} just landed with me. I watch every submission myself, no assistants, no shortcuts. You'll have my personal breakdown within 48 hours.

YOUR SUBMISSION
Type: ${submissionLabel}
Submitted: ${submittedAtLabel}${notesText}

View in Your Dashboard: ${profileUrl}

WHAT HAPPENS NEXT
${whatHappensNextText}

WHILE YOU WAIT
Don't wait on me to get better. Go get 50 good swings today. The players who improve fastest are the ones who work when nobody's watching.

QUICK TIP
Filming another video? Shoot from the side at about hip height with your whole body in frame. 1080p is plenty, and it uploads a lot faster than 4K.

WHY I COACH THIS WAY
When I was 13, an opposing coach told my dad he remembered me. Not for a big game, but because I hustled down the line on a routine ground ball and was standing on second on a routine pop-up. Effort is a skill, and it's the kind that gets you remembered. So here's the question I ask every player I work with: what do you want to be known for?${upsellSectionsText}

${buildEmailFooterText()}`;

  return { subject, html, text };
}

export async function sendSubmissionReceivedEmail(params: {
  toEmail: string;
  firstName: string;
  submissionType: SubmissionConfirmationType;
  playerNotes: string;
  membershipTier: DatabaseTier;
  submittedAt?: Date;
}) {
  const transporter = createTransporter();
  const emailContent = buildSubmissionConfirmationEmailContent({
    firstName: params.firstName,
    submissionType: params.submissionType,
    playerNotes: params.playerNotes,
    isTwelveWeekEnrolled: params.membershipTier === "TWELVE_WEEK",
    submittedAt: params.submittedAt ?? new Date(),
  });

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: params.toEmail,
    replyTo: EMAIL_REPLY_TO,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html,
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
    title: "New Coaching Submission",
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
    subject: "New Coaching Submission",
    text: `New Coaching Submission\n\nMembership Tier: ${getTierLabel(params.membershipTier)}\nPriority: ${getPriorityLabel(params.membershipTier)}\nSubmitting User: ${params.userEmail}\nPlayer Name: ${params.playerName}\nPitch Type Focus: ${params.pitchType}\nHandedness: ${params.handedness}\nPreferred Response: ${params.responsePreference}\nSubmitted Video Reference: ${params.submittedVideo}\nAttached Video: ${attachmentSummary}\nTemporary Download Link: ${tempLinkSummary}\nTemporary Link Expires: ${tempLinkExpiry}\nNotes: ${params.notes || "No notes provided."}`,
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
    title: "New Coaching Submission",
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
    subject: "New Coaching Submission",
    text: `New Coaching Submission\n\nMembership Tier: ${getTierLabel(params.membershipTier)}\nPriority: ${getPriorityLabel(params.membershipTier)}\nSubmitting User: ${params.userEmail}\nPlayer Name: ${params.playerName}\nPlayer Age: ${params.playerAge}\nTopic: ${params.topic}\nMessage: ${params.message}\nVideo Reference: ${params.videoPath ?? "No video uploaded"}\nAttached Video: ${attachmentSummary}\nTemporary Download Link: ${tempLinkSummary}\nTemporary Link Expires: ${tempLinkExpiry}\nResponse Preference: ${params.responsePreference}\nStatus: ${params.status}`,
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

function truncateCoachResponseNotes(notes: string, maxLength = 400) {
  const trimmed = notes.trim();
  if (trimmed.length <= maxLength) {
    return { display: trimmed, truncated: false };
  }

  return {
    display: `${trimmed.slice(0, maxLength)}...`,
    truncated: true,
  };
}

function buildSubmissionResponseEmailContent(params: {
  firstName: string;
  submissionType: "SWING_ANALYSIS" | "MENTAL_GAME";
  submissionId: string;
  writtenResponse?: string;
  recommendedDrillIds?: string[];
  isTwelveWeekEnrolled: boolean;
}) {
  const trimmedFirstName = params.firstName.trim();
  const hasFirstName = trimmedFirstName.length > 0;
  const isSwing = params.submissionType === "SWING_ANALYSIS";
  const responseUrl = buildSubmissionResponseUrl(params.submissionType, params.submissionId);
  const programUrl = `${getPublicAppUrl()}/program`;
  const headline = "Your breakdown is ready.";
  const subject = hasFirstName
    ? isSwing
      ? `Your breakdown is ready, ${trimmedFirstName}`
      : `Your response is ready, ${trimmedFirstName}`
    : isSwing
      ? "Your breakdown is ready"
      : "Your response is ready";
  const intro = hasFirstName
    ? isSwing
      ? `${trimmedFirstName}, I watched your video and recorded a personal breakdown just for you. Watch it with a notebook nearby. There's a lot in there.`
      : `${trimmedFirstName}, I read your question and recorded a personal response just for you.`
    : isSwing
      ? "I watched your video and recorded a personal breakdown just for you. Watch it with a notebook nearby. There's a lot in there."
      : "I read your question and recorded a personal response just for you.";

  const rawNotes = params.writtenResponse?.trim() ?? "";
  const coachNotes = rawNotes ? truncateCoachResponseNotes(rawNotes) : null;
  const coachNotesHtml = coachNotes
    ? `${buildEmailSectionLabel("MY NOTES")}
      <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628; white-space:pre-wrap;">${escapeHtml(coachNotes.display)}${coachNotes.truncated ? `<br /><br /><span style="color:#0A1628;">Read the rest in the app.</span>` : ""}</p>`
    : "";
  const coachNotesText = coachNotes
    ? `\n\nMY NOTES\n${coachNotes.display}${coachNotes.truncated ? "\n\nRead the rest in the app." : ""}`
    : "";

  const recommendedDrills = getDrillLibraryVideosByIds(params.recommendedDrillIds ?? []);
  const drillsHtml =
    recommendedDrills.length > 0
      ? `${buildEmailSectionLabel("DRILLS I PICKED FOR YOU")}
      <ul style="margin:0; padding-left:20px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">
        ${recommendedDrills
          .map((drill) => {
            const drillId = getDrillLibraryVideoId(drill) ?? "";
            const drillUrl = buildDrillLibraryUrl(drillId || undefined);
            return `<li style="margin:0 0 8px 0; color:#0A1628;"><a href="${escapeHtml(drillUrl)}" target="_blank" rel="noopener noreferrer" style="color:#2D6A4F; font-weight:700; text-decoration:underline;">${escapeHtml(drill.title)}</a></li>`;
          })
          .join("")}
      </ul>
      <p style="margin:12px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.6; color:#6B7280;">Each drill opens in the app with the video and coaching cues.</p>`
      : "";
  const drillsText =
    recommendedDrills.length > 0
      ? `\n\nDRILLS I PICKED FOR YOU\n${recommendedDrills
          .map((drill) => {
            const drillId = getDrillLibraryVideoId(drill) ?? "";
            return `- ${drill.title}: ${buildDrillLibraryUrl(drillId || undefined)}`;
          })
          .join("\n")}\n\nEach drill opens in the app with the video and coaching cues.`
      : "";

  const membershipSectionHtml = params.isTwelveWeekEnrolled
    ? `${buildEmailSectionLabel("KEEP IT GOING")}
      <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">Got questions about anything in the breakdown? Bring them to our weekly call, or just reply to this email.</p>`
    : buildEmailNonMemberUpsellHtml({ programPitchVariant: "response", programUrl });
  const membershipSectionText = params.isTwelveWeekEnrolled
    ? `\n\nKEEP IT GOING\nGot questions about anything in the breakdown? Bring them to our weekly call, or just reply to this email.`
    : buildEmailNonMemberUpsellText({ programPitchVariant: "response", programUrl });

  const bodyContentHtml = `<h1 style="margin:0 0 20px 0; font-family:Arial, Helvetica, sans-serif; font-size:28px; line-height:1.3; font-weight:700; color:#0A1628;">${escapeHtml(headline)}</h1>
              <p style="margin:0 0 24px 0; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:1.7; color:#0A1628;">${escapeHtml(intro)}</p>
              ${buildEmailButton("Watch Your Breakdown", responseUrl)}
              ${coachNotesHtml}
              ${drillsHtml}
              ${buildEmailSectionLabel("YOUR NEXT STEP")}
              <ol style="margin:0; padding-left:20px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">
                <li style="margin:0 0 8px 0; color:#0A1628;">Watch the breakdown twice. You'll catch something new the second time.</li>
                <li style="margin:0 0 8px 0; color:#0A1628;">Do these drills at least 3 times this week.</li>
                <li style="margin:0; color:#0A1628;">Send me a new video in 2 weeks so we can see the change.</li>
              </ol>
              ${membershipSectionHtml}`;

  const html = buildMemberEmailHtml({ title: subject, bodyContentHtml });
  const text = `${headline}

${intro}

Watch Your Breakdown: ${responseUrl}${coachNotesText}${drillsText}

YOUR NEXT STEP
1. Watch the breakdown twice. You'll catch something new the second time.
2. Do these drills at least 3 times this week.
3. Send me a new video in 2 weeks so we can see the change.${membershipSectionText}

${buildEmailFooterText()}`;

  return { subject, html, text };
}

export async function sendSubmissionResponseEmail(params: {
  toEmail: string;
  playerName: string;
  submissionId: string;
  submissionType: "SWING_ANALYSIS" | "MENTAL_GAME";
  responseMode: "VIDEO" | "WRITTEN";
  membershipTier?: DatabaseTier;
  writtenResponse?: string;
  videoResponseUrl?: string;
  recommendedDrillIds?: string[];
  videoAttachment?: {
    fileName: string;
    content: Buffer;
    contentType: string;
  };
  videoDownloadLink?: string;
}) {
  const transporter = createTransporter();
  const firstName = params.playerName.trim().split(/\s+/)[0] ?? "";
  const emailContent = buildSubmissionResponseEmailContent({
    firstName,
    submissionType: params.submissionType,
    submissionId: params.submissionId,
    writtenResponse: params.writtenResponse,
    recommendedDrillIds: params.recommendedDrillIds,
    isTwelveWeekEnrolled: params.membershipTier === "TWELVE_WEEK",
  });

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: params.toEmail,
    replyTo: EMAIL_REPLY_TO,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html,
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

function getSettingsUrl() {
  const appUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "");
  return appUrl ? `${appUrl}/settings` : "http://localhost:3000/settings";
}

function getOnboardingWelcomeGuidance(membershipTier: DatabaseTier) {
  switch (membershipTier) {
    case "FREE":
      return "You have one free coaching submission (swing analysis or mental game support) with personal feedback from Coach Broc, plus a free 20-minute Player Assessment Call via Google Meet.";
    case "BASIC":
      return "You have lifetime Basic access to the drill library, all 8 workout programs, and your Pre-Game Warmup, Nutrition, Mental Game Workbook, and Parent Guide PDFs.";
    case "TWELVE_WEEK":
      return "You have full access to the 12-Week Coaching Program, including unlimited coaching submissions, the complete Playbook, workout programs, and weekly check-in calls with Coach Broc.";
    case "MEMORABLE":
      return "You have everything in Basic plus 1-on-1 coaching, monthly swing analysis and mental game support submissions, and accountability support.";
    case "ELITE":
      return "You have everything in Memorable plus 4 coaching submissions per month with rollover up to 8, priority 24-hour response, monthly group coaching calls, and personalized development and training plans.";
  }
}

function getOnboardingMembershipSummaryHtml(membershipTier: DatabaseTier) {
  const settingsUrl = getSettingsUrl();

  if (membershipTier === "FREE") {
    return `<div style="margin-top:16px; padding:14px; border:1px solid #2b3650; border-radius:10px; background:#060b16;">
        <p style="margin:0 0 10px; font-weight:700; color:#98b144;">Membership options</p>
        <p style="margin:0 0 6px;"><strong>Basic ($59 one-time):</strong> Lifetime access to the full drill library, all 8 workout programs, and core training PDFs.</p>
        <p style="margin:0 0 6px;"><strong>Memorable ($149/month or $1,490/year):</strong> Everything in Basic plus 1-on-1 coaching, monthly swing analysis and mental game support submissions, and accountability support.</p>
        <p style="margin:0;"><strong>Elite ($249/month or $2,490/year):</strong> Everything in Memorable plus 4 submissions with rollover, priority 24-hour response, group coaching calls, and personalized plans.</p>
        <p style="margin:10px 0 0;"><a href="${escapeHtml(
          settingsUrl,
        )}" target="_blank" rel="noopener noreferrer" style="color:#8fd7ff; text-decoration:underline;">View plans in Account settings</a></p>
      </div>`;
  }

  if (membershipTier === "BASIC") {
    return `<div style="margin-top:16px; padding:14px; border:1px solid #2b3650; border-radius:10px; background:#060b16;">
        <p style="margin:0 0 10px; font-weight:700; color:#98b144;">Want coaching submissions?</p>
        <p style="margin:0 0 6px;"><strong>Memorable ($149/month or $1,490/year):</strong> Everything in Basic plus 1-on-1 coaching, monthly swing analysis and mental game support submissions, and accountability support.</p>
        <p style="margin:0;"><strong>Elite ($249/month or $2,490/year):</strong> 4 submissions with rollover, priority 24-hour response, group coaching calls, and personalized plans.</p>
        <p style="margin:10px 0 0;"><a href="${escapeHtml(
          settingsUrl,
        )}" target="_blank" rel="noopener noreferrer" style="color:#8fd7ff; text-decoration:underline;">Upgrade in Account settings</a></p>
      </div>`;
  }

  return "";
}

function getOnboardingDrillLibraryMessage(membershipTier: DatabaseTier) {
  if (membershipTier === "FREE") {
    return {
      bodyText:
        "Upgrade to Basic ($59 one-time) to unlock lifetime access to the full hitting, fielding, and mindset drill libraries, all 8 workout programs, and the Pre-Game Warmup, Nutrition, Mental Game Workbook, and Parent Guide PDFs.",
      bodyHtml: `<p style="margin: 0 0 12px;">Upgrade to <strong>Basic ($59 one-time)</strong> to unlock lifetime access to the full hitting, fielding, and mindset drill libraries, all 8 workout programs, and the core training PDFs.</p>
        <p style="margin: 0;">Memorable ($149/month or $1,490/year) includes everything in Basic plus 1-on-1 coaching, monthly swing analysis and mental game support submissions, and accountability support. Elite ($249/month or $2,490/year) adds priority response, group coaching calls, and personalized plans from Coach Broc.</p>`,
    };
  }

  return {
    bodyText:
      "Take a look at the hitting and fielding video libraries and pick one drill to focus on this week. Also explore your workout programs and bonus guides in Resources to strengthen confidence and game focus.",
      bodyHtml: `<p style="margin: 0 0 12px;">Take a look at the hitting and fielding video libraries and choose one drill to focus on this week.</p>
      <p style="margin: 0;">Also explore your workout programs and bonus guides in Resources, plus the mindset library, to strengthen confidence, focus, and in-game composure.</p>`,
  };
}

function getOnboardingWeekOneMessage(membershipTier: DatabaseTier) {
  const settingsUrl = getSettingsUrl();

  switch (membershipTier) {
    case "FREE":
      return {
        text: `You still have one free coaching submission available. When you are ready, submit a swing video or mindset question for personalized feedback from Coach Broc.

Want more each month? Memorable ($149/month or $1,490/year) includes everything in Basic plus 1-on-1 coaching, monthly swing analysis and mental game support submissions, and accountability support. Elite ($249/month or $2,490/year) includes 4 per month with rollover up to 8, priority 24-hour response, and personalized training plans.

Upgrade in Account settings: ${settingsUrl}`,
        html: `<p style="margin: 0 0 12px;">You still have one free coaching submission available. When you are ready, submit a swing video or mindset question for personalized feedback from Coach Broc.</p>
          <p style="margin: 0 0 12px;"><strong>Memorable ($149/month or $1,490/year)</strong> includes everything in Basic plus 1-on-1 coaching, monthly swing analysis and mental game support submissions, and accountability support. <strong>Elite ($249/month or $2,490/year)</strong> includes 4 per month with rollover up to 8, priority 24-hour response, and personalized plans.</p>
          <p style="margin: 0;"><a href="${escapeHtml(
            settingsUrl,
          )}" target="_blank" rel="noopener noreferrer" style="color:#8fd7ff; text-decoration:underline;">Upgrade in Account settings</a></p>`,
      };
    case "BASIC":
      return {
        text: `Ready for personalized coach feedback? Memorable ($149/month or $1,490/year) includes everything in Basic plus 1-on-1 coaching, monthly swing analysis and mental game support submissions, and accountability support. Elite ($249/month or $2,490/year) unlocks 4 per month with rollover up to 8, priority 24-hour response, and personalized plans.

Upgrade in Account settings: ${settingsUrl}`,
        html: `<p style="margin: 0 0 12px;">Ready for personalized coach feedback?</p>
          <p style="margin: 0 0 12px;"><strong>Memorable ($149/month)</strong> includes everything in Basic plus 1-on-1 coaching, monthly swing analysis and mental game support submissions, and accountability support. <strong>Elite ($249/month)</strong> unlocks 4 per month with rollover up to 8, priority 24-hour response, and personalized plans.</p>
          <p style="margin: 0;"><a href="${escapeHtml(
            settingsUrl,
          )}" target="_blank" rel="noopener noreferrer" style="color:#8fd7ff; text-decoration:underline;">Upgrade in Account settings</a></p>`,
      };
    case "TWELVE_WEEK":
      return {
        text: "You have unlimited coaching submissions during your 12-Week Coaching Program. Submit a swing video or mindset request this week, explore the Playbook and workout programs, and book your weekly check-in call with Coach Broc from your dashboard.",
        html: `<p style="margin: 0;">You have <strong>unlimited coaching submissions</strong> during your 12-Week Coaching Program. Submit a swing video or mindset request this week, explore the Playbook and workout programs, and book your weekly check-in call with Coach Broc from your dashboard.</p>`,
      };
    case "MEMORABLE":
      return {
        text: "You have 2 coaching submissions available each month with 48-hour video feedback, plus monthly goal setting and weekly accountability check-ins. Submit a swing video or mindset request this week.",
        html: `<p style="margin: 0;">You have <strong>2 coaching submissions</strong> available each month with 48-hour video feedback, plus monthly goal setting and weekly accountability check-ins. Submit a swing video or mindset request this week.</p>`,
      };
    case "ELITE":
      return {
        text: "You have 4 coaching submissions per month with rollover up to 8, priority 24-hour response, and a weekly training plan curated by Coach Broc. Submit your first coaching request this week.",
        html: `<p style="margin: 0;">You have <strong>4 coaching submissions per month</strong> with rollover up to 8, priority 24-hour response, and a weekly training plan curated by Coach Broc. Submit your first coaching request this week.</p>`,
      };
  }
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
  const introVideosText =
    "Start by watching the intro videos on the landing page so you understand the training flow and how coaching submissions work.";
  const dashboardGuidance = getOnboardingWelcomeGuidance(params.membershipTier);
  const membershipSummaryHtml = getOnboardingMembershipSummaryHtml(params.membershipTier);

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: params.toEmail,
    subject: "Welcome to LCB Training!",
    text: `Hi ${params.displayName},

Welcome to LCB Training!

${introVideosText}
${dashboardGuidance ?? ""}

Current membership: ${tierLabel}
Log in: ${loginUrl}

-LCB Training`,
    html: buildOnboardingEmailShell({
      heading: "Welcome to LCB Training!",
      intro: `Hi ${escapeHtml(params.displayName)}, welcome aboard.`,
      bodyHtml: `<p style="margin: 0 0 12px;">${escapeHtml(introVideosText)}</p>
        <p style="margin: 0 0 12px;">${escapeHtml(dashboardGuidance ?? "")}</p>
        <p style="margin: 0 0 16px;"><strong style="color:#98b144;">Current Membership:</strong> ${escapeHtml(
          tierLabel,
        )}</p>
        ${membershipSummaryHtml}
        <p style="margin: 16px 0 0;"><a href="${escapeHtml(
          loginUrl,
        )}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background:#22c55e; color:#0a0a0a; text-decoration:none; font-weight:700; padding:10px 16px; border-radius:999px;">Log In to Your Dashboard</a></p>`,
    }),
  });
}

export async function sendOnboardingEmail2(params: {
  toEmail: string;
  displayName: string;
  membershipTier: DatabaseTier;
}) {
  const transporter = createTransporter();
  const drillLibraryMessage = getOnboardingDrillLibraryMessage(params.membershipTier);

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: params.toEmail,
    subject: "Have you checked out the drill library?",
    text: `Hi ${params.displayName},

Have you checked out the drill library?

${drillLibraryMessage.bodyText}

-LCB Training`,
    html: buildOnboardingEmailShell({
      heading: "Have you checked out the drill library?",
      intro: `Hi ${escapeHtml(params.displayName)}, quick check-in from the LCB Training team.`,
      bodyHtml: drillLibraryMessage.bodyHtml,
    }),
  });
}

export async function sendOnboardingEmail3(params: {
  toEmail: string;
  displayName: string;
  membershipTier: DatabaseTier;
}) {
  const transporter = createTransporter();
  const weekOneMessage = getOnboardingWeekOneMessage(params.membershipTier);

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: params.toEmail,
    subject: "Time to put your skills to the test!",
    text: `Hi ${params.displayName},

Time to put your skills to the test!

${weekOneMessage?.text ?? ""}

-LCB Training`,
    html: buildOnboardingEmailShell({
      heading: "Time to put your skills to the test!",
      intro: `Hi ${escapeHtml(params.displayName)}, you are one week in.`,
      bodyHtml: weekOneMessage?.html ?? "",
    }),
  });
}

export async function sendGoalCheckinSubmissionNotification(params: {
  memberName: string;
  memberEmail: string;
  membershipTier: DatabaseTier;
  monthlyFocus: string;
  lastMonthReview: string;
  focusArea: string;
  additionalNotes: string | null;
  goals?: Array<{
    category: string;
    description: string;
    targetValue: string | null;
  }>;
}) {
  const transporter = createTransporter();
  const goalRows =
    params.goals?.map((goal, index) => ({
      label: `Goal ${index + 1}`,
      value: `${goal.category}: ${goal.description}${
        goal.targetValue ? ` (Target: ${goal.targetValue})` : ""
      }`,
    })) ?? [];

  const html = buildSubmissionNotificationHtml({
    title: "New Monthly Goal Check-In",
    membershipTier: params.membershipTier,
    userEmail: params.memberEmail,
    detailRows: [
      { label: "Member Name", value: params.memberName },
      { label: "Main Focus This Month", value: params.monthlyFocus },
      { label: "Last Month Review", value: params.lastMonthReview },
      { label: "Focus Area", value: params.focusArea },
      {
        label: "Additional Notes",
        value: params.additionalNotes ?? "None provided",
      },
      ...goalRows,
      { label: "Status", value: "pending" },
    ],
  });

  const goalText =
    params.goals
      ?.map(
        (goal, index) =>
          `Goal ${index + 1}: ${goal.category} - ${goal.description}${
            goal.targetValue ? ` (Target: ${goal.targetValue})` : ""
          }`,
      )
      .join("\n") ?? "";

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: getNotificationRecipient(),
    subject: "New Monthly Goal Check-In Submission",
    text: `New Monthly Goal Check-In

Member: ${params.memberName}
Email: ${params.memberEmail}
Membership Tier: ${getTierLabel(params.membershipTier)}
Main Focus: ${params.monthlyFocus}
Last Month Review: ${params.lastMonthReview}
Focus Area: ${params.focusArea}
Additional Notes: ${params.additionalNotes ?? "None provided"}
${goalText ? `\nMonthly Goals:\n${goalText}` : ""}`,
    html,
  });
}

export async function sendGoalCheckinReceivedEmail(params: {
  toEmail: string;
  displayName: string;
}) {
  const transporter = createTransporter();
  const goalSettingUrl = `${getPublicAppUrl()}/goal-setting`;

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: params.toEmail,
    subject: "Your Monthly Goals Were Received",
    text: `Hi ${params.displayName},

Your monthly goal check-in was received. Coach Broc will review your goals and respond within 48 hours.

View your submission: ${goalSettingUrl}

-LCB Training`,
    html: buildOnboardingEmailShell({
      heading: "Goals Received",
      intro: `Hi ${escapeHtml(params.displayName)}, your monthly goal check-in was received.`,
      bodyHtml: `<p style="margin: 0 0 12px;">Coach Broc will review your goals and respond within 48 hours.</p>
        <p style="margin: 0;"><a href="${escapeHtml(
          goalSettingUrl,
        )}" target="_blank" rel="noopener noreferrer" style="color:#8fd7ff; text-decoration:underline;">View your submission</a></p>`,
    }),
  });
}

export async function sendGoalCheckinResponseEmail(params: {
  toEmail: string;
  displayName: string;
  coachResponse: string;
}) {
  const transporter = createTransporter();
  const goalSettingUrl = `${getPublicAppUrl()}/goal-setting`;

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: params.toEmail,
    subject: "Coach Broc Responded to Your Monthly Goals",
    text: `Hi ${params.displayName},

Coach Broc reviewed your monthly goals and sent a personal response:

${params.coachResponse}

View the full response on your goal setting page: ${goalSettingUrl}

-LCB Training`,
    html: buildOnboardingEmailShell({
      heading: "Coach Broc Responded to Your Goals",
      intro: `Hi ${escapeHtml(params.displayName)}, Coach Broc reviewed your monthly goals.`,
      bodyHtml: `<p style="margin: 0 0 12px; white-space: pre-wrap;">${escapeHtml(
        params.coachResponse,
      )}</p>
        <p style="margin: 0;"><a href="${escapeHtml(
          goalSettingUrl,
        )}" target="_blank" rel="noopener noreferrer" style="color:#8fd7ff; text-decoration:underline;">View on your goal setting page</a></p>`,
    }),
  });
}

export async function sendMemorableWelcomeEmail(params: {
  toEmail: string;
  displayName: string;
}) {
  const transporter = createTransporter();
  const goalSettingUrl = `${getPublicAppUrl()}/goal-setting`;
  const coachingUrl = `${getPublicAppUrl()}/coaching-submissions`;

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: params.toEmail,
    subject: "Welcome to LCB Training Memorable -- Let's Get to Work",
    text: `Hi ${params.displayName},

Welcome to LCB Training Memorable. I am excited to coach you personally this month.

You now have access to:
- 2 coaching submissions per month
- Personal video feedback within 48 hours
- Monthly goal check-in
- Weekly accountability check-ins
- Direct access to Coach Broc

You now have direct access to me between submissions. Reach me anytime at chrisbroc05@gmail.com -- I am here to help.

Start with your first monthly goals: ${goalSettingUrl}
Submit your first coaching submission: ${coachingUrl}

-Coach Broc
LCB Training`,
    html: buildOnboardingEmailShell({
      heading: "Welcome to LCB Training Memorable",
      intro: `Hi ${escapeHtml(params.displayName)}, welcome aboard. I am excited to coach you personally this month.`,
      bodyHtml: `<p style="margin: 0 0 12px;">You now have access to:</p>
        <ul style="margin: 0 0 12px; padding-left: 20px;">
          <li>2 coaching submissions per month</li>
          <li>Personal video feedback within 48 hours</li>
          <li>Monthly goal check-in</li>
          <li>Weekly accountability check-ins</li>
          <li>Direct access to Coach Broc</li>
        </ul>
        <p style="margin: 0 0 12px;">You now have direct access to me between submissions. Reach me anytime at <a href="mailto:chrisbroc05@gmail.com" style="color:#8fd7ff; text-decoration:underline;">chrisbroc05@gmail.com</a> -- I am here to help.</p>
        <p style="margin: 0 0 8px;"><a href="${escapeHtml(
          goalSettingUrl,
        )}" target="_blank" rel="noopener noreferrer" style="color:#8fd7ff; text-decoration:underline;">Submit your first monthly goals</a></p>
        <p style="margin: 0 0 16px;"><a href="${escapeHtml(
          coachingUrl,
        )}" target="_blank" rel="noopener noreferrer" style="color:#8fd7ff; text-decoration:underline;">Submit your first coaching submission</a></p>
        <p style="margin: 0;">-Coach Broc<br/>LCB Training</p>`,
    }),
  });
}

export async function sendEliteWelcomeEmail(params: {
  toEmail: string;
  displayName: string;
}) {
  const transporter = createTransporter();
  const goalSettingUrl = `${getPublicAppUrl()}/goal-setting`;
  const coachingUrl = `${getPublicAppUrl()}/coaching-submissions`;

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: params.toEmail,
    subject: "Welcome to LCB Training Elite -- You Are All In",
    text: `Hi ${params.displayName},

Welcome to LCB Training Elite. Thank you for choosing the highest level of coaching.

You now have access to:
- 4 coaching submissions per month with rollover up to 8
- Priority 24-hour response
- Monthly group coaching call
- Personalized development plan
- Goal check-ins
- Weekly check-ins
- Direct access to Coach Broc

As an Elite member you are my top priority. Reach me anytime at chrisbroc05@gmail.com -- you will always hear back from me first.

Start with your first monthly goals: ${goalSettingUrl}
Book your first coaching submission: ${coachingUrl}

Details about the monthly group coaching call will be sent to you separately -- stay tuned.

-Coach Broc
LCB Training`,
    html: buildOnboardingEmailShell({
      heading: "Welcome to LCB Training Elite",
      intro: `Hi ${escapeHtml(params.displayName)}, welcome aboard. Thank you for choosing the highest level of coaching.`,
      bodyHtml: `<p style="margin: 0 0 12px;">You now have access to:</p>
        <ul style="margin: 0 0 12px; padding-left: 20px;">
          <li>4 coaching submissions per month with rollover up to 8</li>
          <li>Priority 24-hour response</li>
          <li>Monthly group coaching call</li>
          <li>Personalized development plan</li>
          <li>Goal check-ins</li>
          <li>Weekly check-ins</li>
          <li>Direct access to Coach Broc</li>
        </ul>
        <p style="margin: 0 0 12px;">As an Elite member you are my top priority. Reach me anytime at <a href="mailto:chrisbroc05@gmail.com" style="color:#8fd7ff; text-decoration:underline;">chrisbroc05@gmail.com</a> -- you will always hear back from me first.</p>
        <p style="margin: 0 0 8px;"><a href="${escapeHtml(
          goalSettingUrl,
        )}" target="_blank" rel="noopener noreferrer" style="color:#8fd7ff; text-decoration:underline;">Submit your first monthly goals</a></p>
        <p style="margin: 0 0 12px;"><a href="${escapeHtml(
          coachingUrl,
        )}" target="_blank" rel="noopener noreferrer" style="color:#8fd7ff; text-decoration:underline;">Book your first coaching submission</a></p>
        <p style="margin: 0 0 16px;">Details about the monthly group coaching call will be sent to you separately -- stay tuned.</p>
        <p style="margin: 0;">-Coach Broc<br/>LCB Training</p>`,
    }),
  });
}

export async function sendPlaybookReflectionSharedNotification(params: {
  memberName: string;
  memberEmail: string;
  membershipTier: DatabaseTier;
  chapterNumber: number;
  chapterTitle: string;
}) {
  const transporter = createTransporter();
  const adminUrl = `${getPublicAppUrl()}/admin`;

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: getNotificationRecipient(),
    subject: `${params.memberName} shared their Chapter ${params.chapterNumber} reflections with you`,
    text: `Hey Coach Broc -- ${params.memberName} just shared their Chapter ${params.chapterNumber} reflections from The Next Level Playbook. Log in to review them at ${adminUrl}`,
    html: buildOnboardingEmailShell({
      heading: "Playbook Reflections Shared",
      intro: `Hey Coach Broc -- ${params.memberName} just shared Chapter ${params.chapterNumber} reflections.`,
      bodyHtml: `<p style="margin: 0 0 12px;"><strong>Chapter:</strong> ${escapeHtml(
        params.chapterTitle,
      )}</p>
        <p style="margin: 0 0 12px;"><strong>Member:</strong> ${escapeHtml(
          params.memberName,
        )} (${escapeHtml(params.memberEmail)})</p>
        <p style="margin: 0 0 12px;"><strong>Membership Tier:</strong> ${escapeHtml(
          getTierLabel(params.membershipTier),
        )}</p>
        <p style="margin: 0;"><a href="${escapeHtml(
          adminUrl,
        )}" target="_blank" rel="noopener noreferrer" style="color:#8fd7ff; text-decoration:underline;">Log in to review them at lcbtraining.com/admin</a></p>`,
    }),
  });
}

export async function sendAccountDeletionRequestNotification(params: {
  memberName: string;
  memberEmail: string;
  membershipTier: DatabaseTier;
}) {
  const transporter = createTransporter();
  const adminUrl = `${getPublicAppUrl()}/admin`;

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: getNotificationRecipient(),
    subject: `${params.memberName} has requested account deletion`,
    text: `${params.memberName} (${params.memberEmail}) has requested account deletion. Log in to review their account at ${adminUrl}`,
    html: buildOnboardingEmailShell({
      heading: "Account Deletion Request",
      intro: `${params.memberName} has requested account deletion.`,
      bodyHtml: `<p style="margin: 0 0 12px;"><strong>Member:</strong> ${escapeHtml(
        params.memberName,
      )} (${escapeHtml(params.memberEmail)})</p>
        <p style="margin: 0 0 12px;"><strong>Membership Tier:</strong> ${escapeHtml(
          getTierLabel(params.membershipTier),
        )}</p>
        <p style="margin: 0;">This is a support request. Handle account deletion manually after confirming with the member.</p>
        <p style="margin: 12px 0 0;"><a href="${escapeHtml(
          adminUrl,
        )}" target="_blank" rel="noopener noreferrer" style="color:#8fd7ff; text-decoration:underline;">Log in to review at lcbtraining.com/admin</a></p>`,
    }),
  });
}
