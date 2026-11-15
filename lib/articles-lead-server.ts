import "server-only";

import { renderArticlePdfToBuffer } from "@/lib/articles-pdf-node";
import { isValidArticleSlug } from "@/lib/articles-shared";
import { getPublishedArticleBySlug } from "@/lib/articles-server";
import {
  buildEmailFooterText,
  buildMemberEmailHtml,
  EMAIL_REPLY_TO,
  escapeHtml,
  getPublicAppUrl,
} from "@/lib/email-layout";
import { sendNotificationEmail } from "@/lib/email-delivery-server";
import { normalizeLeadCaptureInput } from "@/lib/lead-capture-shared";
import { buildLeadUnsubscribeUrl } from "@/lib/lead-unsubscribe-token";
import { normalizeLeadEmail, upsertLeadForArticle } from "@/lib/leads-server";
import { assertCompanyMailingAddressForMarketing } from "@/lib/marketing-email-guard-server";
import type { LeadRoleValue } from "@/lib/resources-shared";

export type ArticleLeadCaptureInput = {
  articleSlug: string;
  firstName: string;
  email: string;
  role: LeadRoleValue;
  playerAge13Plus?: boolean | null;
  parentEmail?: string | null;
};

function buildUnsubscribeFooterHtml(leadId: string) {
  const url = buildLeadUnsubscribeUrl(leadId);
  return `<p style="margin:24px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.6; color:#6B7280;"><a href="${escapeHtml(url)}" style="color:#2D6A4F; text-decoration:underline;">Unsubscribe from training tips and offers</a></p>`;
}

function buildUnsubscribeFooterText(leadId: string) {
  return `\nUnsubscribe: ${buildLeadUnsubscribeUrl(leadId)}`;
}

export async function sendArticlePrintablePdfEmail(params: {
  toEmail: string;
  firstName: string;
  leadId: string;
  articleTitle: string;
  articleSlug: string;
  pdfBuffer: Buffer;
}) {
  assertCompanyMailingAddressForMarketing();

  const articleUrl = `${getPublicAppUrl()}/articles/${params.articleSlug}`;
  const subject = `Your printable plan: ${params.articleTitle}`;
  const bodyHtml = `<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:1.7; color:#0A1628;">Hi ${escapeHtml(params.firstName)},</p>
<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:1.7; color:#0A1628;">Here's your printable one-pager for <strong>${escapeHtml(params.articleTitle)}</strong>. I'll also send new drills and articles when I post them.</p>
<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">Full article: <a href="${escapeHtml(articleUrl)}" style="color:#2D6A4F; text-decoration:underline;">${escapeHtml(articleUrl)}</a></p>
${buildUnsubscribeFooterHtml(params.leadId)}`;

  const text = `Hi ${params.firstName},

Here's your printable one-pager for ${params.articleTitle}. I'll also send new drills and articles when I post them.

Full article: ${articleUrl}${buildUnsubscribeFooterText(params.leadId)}

${buildEmailFooterText()}`;

  const html = buildMemberEmailHtml({
    title: subject,
    bodyContentHtml: bodyHtml,
  });

  const fromEmail = process.env.NOTIFICATION_EMAIL;
  if (!fromEmail) {
    throw new Error("NOTIFICATION_EMAIL is required.");
  }

  const safeFilename = params.articleSlug.replace(/[^a-z0-9-]+/gi, "-").slice(0, 80) || "article";

  await sendNotificationEmail({
    from: `"Coach Broc | LCB Training" <${fromEmail}>`,
    to: params.toEmail,
    replyTo: EMAIL_REPLY_TO,
    subject,
    html,
    text,
    attachments: [
      {
        filename: `${safeFilename}.pdf`,
        content: params.pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}

export async function captureArticleLeadAndSendPdf(input: ArticleLeadCaptureInput) {
  const articleSlug = input.articleSlug.trim();
  if (!isValidArticleSlug(articleSlug)) {
    throw new Error("INVALID_ARTICLE");
  }

  const article = await getPublishedArticleBySlug(articleSlug);
  if (!article) {
    throw new Error("ARTICLE_NOT_FOUND");
  }

  const normalized = normalizeLeadCaptureInput({
    firstName: input.firstName,
    email: input.email,
    role: input.role,
    playerAge13Plus: input.playerAge13Plus,
    parentEmail: input.parentEmail,
  });
  if (!normalized.ok) {
    throw new Error(`LEAD_CAPTURE_INVALID:${normalized.error}`);
  }

  const { lead } = await upsertLeadForArticle({
    email: normalized.value.email,
    firstName: normalized.value.firstName,
    role: normalized.value.role,
    articleSlug: article.slug,
    emailProvidedByParent: normalized.value.emailProvidedByParent,
  });

  const publicUrl = `${getPublicAppUrl()}/articles/${article.slug}`;
  const pdfBuffer = await renderArticlePdfToBuffer({
    title: article.title,
    authorName: article.authorName,
    contentMarkdown: article.contentMarkdown,
    publicUrl,
  });

  await sendArticlePrintablePdfEmail({
    toEmail: normalizeLeadEmail(normalized.value.email),
    firstName: normalized.value.firstName,
    leadId: lead.id,
    articleTitle: article.title,
    articleSlug: article.slug,
    pdfBuffer,
  });

  return { leadId: lead.id };
}
