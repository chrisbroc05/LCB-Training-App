import "server-only";

import type { LeadRole } from "@prisma/client";
import { buildArticleLeadSource, isArticleLeadSource } from "@/lib/articles-lead-shared";
import { normalizeLeadEmail } from "@/lib/leads-shared";
import { buildLeadMarketingAutoExcludeData } from "@/lib/lead-marketing-server";
import { prisma } from "@/lib/prisma";
import { getResourceDefinition, type LeadRoleValue } from "@/lib/resources-shared";

export { normalizeLeadEmail };

export function toPrismaLeadRole(role: LeadRoleValue): LeadRole {
  return role as LeadRole;
}

function shouldStampLeadSource(source: string | undefined) {
  return (
    source === "quiz" ||
    Boolean(source && source.startsWith("ig-")) ||
    isArticleLeadSource(source)
  );
}

export async function linkLeadToUserByEmail(userId: string, email: string) {
  const normalized = normalizeLeadEmail(email);
  const lead = await prisma.lead.findUnique({
    where: { email: normalized },
    select: { id: true, unsubscribedAt: true },
  });

  if (!lead) {
    return;
  }

  await prisma.lead.update({
    where: { id: lead.id },
    data: { userId },
  });

  if (lead.unsubscribedAt) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        notifyAnnouncements: false,
        marketingEmailsSuppressed: true,
      },
    });
  }
}

export async function upsertLeadForResourceDownload(params: {
  email: string;
  firstName: string;
  role: LeadRoleValue;
  resourceSlug: string;
  source?: string;
  emailProvidedByParent?: boolean;
  /** When set (e.g. challenge share), stored on the lead for analytics. */
  quizChallengeRef?: string | null;
}) {
  const email = normalizeLeadEmail(params.email);
  const marketingAutoExclude = buildLeadMarketingAutoExcludeData(email);
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, accountRole: true, playerFirstName: true, accountHolderName: true },
  });

  const source = params.source?.trim() || undefined;
  const stampSource = shouldStampLeadSource(source);

  const lead = await prisma.lead.upsert({
    where: { email },
    create: {
      email,
      firstName: params.firstName.trim(),
      role: toPrismaLeadRole(params.role),
      source: source ?? "resources",
      firstResourceSlug: params.resourceSlug,
      userId: existingUser?.id ?? null,
      emailProvidedByParent: params.emailProvidedByParent ?? false,
      ...(params.quizChallengeRef ? { quizChallengeRef: params.quizChallengeRef } : {}),
      ...(marketingAutoExclude ?? {}),
    },
    update: {
      firstName: params.firstName.trim(),
      role: toPrismaLeadRole(params.role),
      userId: existingUser?.id ?? undefined,
      ...(params.emailProvidedByParent ? { emailProvidedByParent: true } : {}),
      /** Quiz, Instagram free-link, and article sources take precedence over generic "resources". */
      ...(stampSource && source ? { source } : {}),
      ...(params.source === "quiz" && params.quizChallengeRef
        ? { quizChallengeRef: params.quizChallengeRef }
        : {}),
      ...(marketingAutoExclude ?? {}),
    },
  });

  await prisma.leadResource.create({
    data: {
      leadId: lead.id,
      resourceSlug: params.resourceSlug,
    },
  });

  return { lead, existingUser };
}

export async function upsertLeadForArticle(params: {
  email: string;
  firstName: string;
  role: LeadRoleValue;
  articleSlug: string;
  emailProvidedByParent?: boolean;
}) {
  const email = normalizeLeadEmail(params.email);
  const marketingAutoExclude = buildLeadMarketingAutoExcludeData(email);
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  const source = buildArticleLeadSource(params.articleSlug);

  const lead = await prisma.lead.upsert({
    where: { email },
    create: {
      email,
      firstName: params.firstName.trim(),
      role: toPrismaLeadRole(params.role),
      source,
      userId: existingUser?.id ?? null,
      emailProvidedByParent: params.emailProvidedByParent ?? false,
      ...(marketingAutoExclude ?? {}),
    },
    update: {
      firstName: params.firstName.trim(),
      role: toPrismaLeadRole(params.role),
      userId: existingUser?.id ?? undefined,
      source,
      ...(params.emailProvidedByParent ? { emailProvidedByParent: true } : {}),
      ...(marketingAutoExclude ?? {}),
    },
  });

  return { lead, existingUser };
}

export async function markLeadAsBuyer(email: string) {
  const normalized = normalizeLeadEmail(email);
  await prisma.lead.updateMany({
    where: { email: normalized },
    data: { isBuyer: true },
  });
}

export async function getLeadLatestResourceTitle(leadId: string) {
  const latest = await prisma.leadResource.findFirst({
    where: { leadId },
    orderBy: { createdAt: "desc" },
    select: { resourceSlug: true },
  });
  if (!latest) {
    return null;
  }
  return getResourceDefinition(latest.resourceSlug)?.title ?? null;
}
