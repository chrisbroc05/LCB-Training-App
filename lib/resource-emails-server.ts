import "server-only";

import nodemailer from "nodemailer";
import {
  buildEmailButton,
  buildEmailFooterText,
  buildMemberEmailHtml,
  EMAIL_REPLY_TO,
  escapeHtml,
  getPublicAppUrl,
} from "@/lib/email-layout";
import { buildLeadUnsubscribeUrl } from "@/lib/lead-unsubscribe-token";
import { createFixItPlanAccessToken } from "@/lib/fix-it-plan-access-token";
import { buildFixItPlanPath, isFixItResourceSlug } from "@/lib/fix-it-plans-shared";
import { getResourceDefinition, getResourceDownloadLabel } from "@/lib/resources-shared";
import { createResourceDownloadToken } from "@/lib/resource-download-token";

function createTransporter() {
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  const emailPassword = process.env.EMAIL_PASSWORD;
  if (!notificationEmail || !emailPassword) {
    throw new Error("NOTIFICATION_EMAIL and EMAIL_PASSWORD are required.");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: notificationEmail, pass: emailPassword },
  });
}

function buildDownloadLink(email: string, resourceSlug: string, fileKey: string) {
  const token = createResourceDownloadToken({ email, resourceSlug, fileKey });
  return `${getPublicAppUrl()}/api/resources/download?token=${encodeURIComponent(token)}`;
}

function buildLeadUnsubscribeFooterHtml(leadId: string) {
  const url = buildLeadUnsubscribeUrl(leadId);
  return `<p style="margin:24px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.6; color:#6B7280;"><a href="${escapeHtml(url)}" style="color:#2D6A4F; text-decoration:underline;">Unsubscribe from training tips and offers</a></p>`;
}

function buildLeadUnsubscribeFooterText(leadId: string) {
  return `\nUnsubscribe: ${buildLeadUnsubscribeUrl(leadId)}`;
}

export async function sendResourceDeliveryEmail(params: {
  toEmail: string;
  firstName: string;
  resourceSlug: string;
  leadId: string;
}) {
  const resource = getResourceDefinition(params.resourceSlug);
  if (!resource?.downloadFileKeys?.length) {
    throw new Error("Resource has no downloadable files.");
  }

  const linksHtml = resource.downloadFileKeys
    .map((fileKey) => {
      const label = getResourceDownloadLabel(fileKey);
      const href = buildDownloadLink(params.toEmail, params.resourceSlug, fileKey);
      return `<li style="margin:0 0 8px 0;"><a href="${escapeHtml(href)}" style="color:#2D6A4F; text-decoration:underline;">${escapeHtml(label)}</a></li>`;
    })
    .join("");

  const linksText = resource.downloadFileKeys
    .map((fileKey) => {
      const label = getResourceDownloadLabel(fileKey);
      const href = buildDownloadLink(params.toEmail, params.resourceSlug, fileKey);
      return `- ${label}: ${href}`;
    })
    .join("\n");

  const subject = `Your ${resource.title} from LCB Training`;
  const bodyHtml = `<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:1.7; color:#0A1628;">Hi ${escapeHtml(params.firstName)},</p>
<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:1.7; color:#0A1628;">Thanks for grabbing <strong>${escapeHtml(resource.title)}</strong>. Use the links below to download. Each link expires in 15 minutes for security, so save the PDFs to your device.</p>
<ul style="margin:0 0 16px 20px; padding:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${linksHtml}</ul>
${buildLeadUnsubscribeFooterHtml(params.leadId)}`;

  const text = `Hi ${params.firstName},

Thanks for grabbing ${resource.title}. Download links (expire in 15 minutes):

${linksText}${buildLeadUnsubscribeFooterText(params.leadId)}

${buildEmailFooterText()}`;

  const html = buildMemberEmailHtml({
    title: subject,
    bodyContentHtml: bodyHtml,
  });

  const fromEmail = process.env.NOTIFICATION_EMAIL;
  if (!fromEmail) {
    throw new Error("NOTIFICATION_EMAIL is required.");
  }

  await createTransporter().sendMail({
    from: `"Coach Broc | LCB Training" <${fromEmail}>`,
    to: params.toEmail,
    replyTo: EMAIL_REPLY_TO,
    subject,
    html,
    text,
  });
}

export async function sendResourceDownloadLinksEmail(params: {
  toEmail: string;
  resourceSlug: string;
}) {
  const resource = getResourceDefinition(params.resourceSlug);
  if (!resource?.downloadFileKeys?.length) {
    throw new Error("Resource has no downloadable files.");
  }

  const linksHtml = resource.downloadFileKeys
    .map((fileKey) => {
      const label = getResourceDownloadLabel(fileKey);
      const href = buildDownloadLink(params.toEmail, params.resourceSlug, fileKey);
      return `<li style="margin:0 0 8px 0;"><a href="${escapeHtml(href)}" style="color:#2D6A4F; text-decoration:underline;">${escapeHtml(label)}</a></li>`;
    })
    .join("");

  const subject = `Your ${resource.title} download links`;
  const bodyHtml = `<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:1.7; color:#0A1628;">Here are fresh download links for <strong>${escapeHtml(resource.title)}</strong>. Each link expires in 15 minutes, so save the PDFs to your device.</p>
<ul style="margin:0 0 16px 20px; padding:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${linksHtml}</ul>`;

  const linksText = resource.downloadFileKeys
    .map((fileKey) => {
      const label = getResourceDownloadLabel(fileKey);
      const href = buildDownloadLink(params.toEmail, params.resourceSlug, fileKey);
      return `- ${label}: ${href}`;
    })
    .join("\n");

  const text = `Download links for ${resource.title} (expire in 15 minutes):\n\n${linksText}\n\n${buildEmailFooterText()}`;

  const fromEmail = process.env.NOTIFICATION_EMAIL;
  if (!fromEmail) {
    throw new Error("NOTIFICATION_EMAIL is required.");
  }

  await createTransporter().sendMail({
    from: `"Coach Broc | LCB Training" <${fromEmail}>`,
    to: params.toEmail,
    replyTo: EMAIL_REPLY_TO,
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml: bodyHtml }),
    text,
  });
}

export async function sendFixItPlanAccessLinkEmail(params: {
  toEmail: string;
  resourceSlug: string;
}) {
  const resource = getResourceDefinition(params.resourceSlug);
  if (!resource || !isFixItResourceSlug(params.resourceSlug)) {
    throw new Error("Invalid Fix-It resource slug.");
  }

  const planToken = createFixItPlanAccessToken({
    email: params.toEmail,
    resourceSlug: params.resourceSlug,
  });
  const planUrl = `${getPublicAppUrl()}${buildFixItPlanPath(params.resourceSlug)}?token=${encodeURIComponent(planToken)}`;

  const subject = `Your ${resource.title} plan link`;
  const bodyHtml = `<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:1.7; color:#0A1628;">Here is your private plan page with drill videos:</p>
${buildEmailButton("Open your Fix-It plan", planUrl)}
<p style="margin:16px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.7; color:#6B7280;">Bookmark this link or save the PDF from your plan page.</p>`;

  const text = `Your private Fix-It plan page:\n${planUrl}\n\n${buildEmailFooterText()}`;

  const fromEmail = process.env.NOTIFICATION_EMAIL;
  if (!fromEmail) {
    throw new Error("NOTIFICATION_EMAIL is required.");
  }

  await createTransporter().sendMail({
    from: `"Coach Broc | LCB Training" <${fromEmail}>`,
    to: params.toEmail,
    replyTo: EMAIL_REPLY_TO,
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml: bodyHtml }),
    text,
  });
}

export async function sendResourcePurchaseReceiptEmail(params: {
  toEmail: string;
  firstName: string;
  resourceSlug: string;
}) {
  const resource = getResourceDefinition(params.resourceSlug);
  if (!resource?.downloadFileKeys?.length) {
    throw new Error("Resource has no downloadable files.");
  }

  const successUrl = `${getPublicAppUrl()}/resources/success`;
  const planPageHtml = isFixItResourceSlug(params.resourceSlug)
    ? (() => {
        const planToken = createFixItPlanAccessToken({
          email: params.toEmail,
          resourceSlug: params.resourceSlug,
        });
        const planUrl = `${getPublicAppUrl()}${buildFixItPlanPath(params.resourceSlug)}?token=${encodeURIComponent(planToken)}`;
        return `<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:1.7; color:#0A1628;">Your private plan page with drill videos: <a href="${escapeHtml(planUrl)}" style="color:#2D6A4F; text-decoration:underline;">Open your Fix-It plan</a></p>`;
      })()
    : "";

  const linksHtml = resource.downloadFileKeys
    .map((fileKey) => {
      const label = getResourceDownloadLabel(fileKey);
      const href = buildDownloadLink(params.toEmail, params.resourceSlug, fileKey);
      return `<li style="margin:0 0 8px 0;"><a href="${escapeHtml(href)}" style="color:#2D6A4F; text-decoration:underline;">${escapeHtml(label)}</a></li>`;
    })
    .join("");

  const subject = `Receipt: ${resource.title}`;
  const bodyHtml = `<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:1.7; color:#0A1628;">Hi ${escapeHtml(params.firstName)},</p>
<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:1.7; color:#0A1628;">Thank you for your purchase of <strong>${escapeHtml(resource.title)}</strong>.</p>
${planPageHtml}
<ul style="margin:0 0 16px 20px; padding:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${linksHtml}</ul>
<p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.7; color:#6B7280;">You can also open <a href="${escapeHtml(successUrl)}" style="color:#2D6A4F; text-decoration:underline;">your downloads page</a> any time while logged in.</p>`;

  const text = `Hi ${params.firstName},

Thank you for your purchase of ${resource.title}.
${
    isFixItResourceSlug(params.resourceSlug)
      ? `\nPlan page: ${getPublicAppUrl()}${buildFixItPlanPath(params.resourceSlug)}?token=${encodeURIComponent(
          createFixItPlanAccessToken({
            email: params.toEmail,
            resourceSlug: params.resourceSlug,
          }),
        )}\n`
      : ""
  }
${resource.downloadFileKeys
  .map((fileKey) => `${getResourceDownloadLabel(fileKey)}: ${buildDownloadLink(params.toEmail, params.resourceSlug, fileKey)}`)
  .join("\n")}

${buildEmailFooterText()}`;

  const fromEmail = process.env.NOTIFICATION_EMAIL;
  if (!fromEmail) {
    throw new Error("NOTIFICATION_EMAIL is required.");
  }

  await createTransporter().sendMail({
    from: `"Coach Broc | LCB Training" <${fromEmail}>`,
    to: params.toEmail,
    replyTo: EMAIL_REPLY_TO,
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml: bodyHtml }),
    text,
  });
}

export async function sendLeadFreeAccountInviteEmail(params: {
  toEmail: string;
  firstName: string;
  leadId: string;
}) {
  const signupUrl = `${getPublicAppUrl()}/auth?redirect=${encodeURIComponent("/swing-analysis")}`;
  const subject = "Create your free LCB account for swing analysis";
  const bodyHtml = `<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:1.7; color:#0A1628;">Hi ${escapeHtml(params.firstName)},</p>
<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:1.7; color:#0A1628;">You grabbed one of my free resources recently. When you are ready, create a free account and send me a swing video. I will send back what I see and what to work on.</p>
${buildEmailButton("Create free account", signupUrl)}
${buildLeadUnsubscribeFooterHtml(params.leadId)}`;

  const text = `Hi ${params.firstName},

Create a free account and send me a swing video: ${signupUrl}${buildLeadUnsubscribeFooterText(params.leadId)}

${buildEmailFooterText()}`;

  const fromEmail = process.env.NOTIFICATION_EMAIL;
  if (!fromEmail) {
    throw new Error("NOTIFICATION_EMAIL is required.");
  }

  await createTransporter().sendMail({
    from: `"Coach Broc | LCB Training" <${fromEmail}>`,
    to: params.toEmail,
    replyTo: EMAIL_REPLY_TO,
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml: bodyHtml }),
    text,
  });
}
