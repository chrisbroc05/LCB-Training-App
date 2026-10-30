import "server-only";

import type { LeadRole } from "@prisma/client";
import { normalizeLeadEmail } from "@/lib/leads-shared";
import { prisma } from "@/lib/prisma";
import { getResourceDefinition, type LeadRoleValue } from "@/lib/resources-shared";

export { normalizeLeadEmail };

export function toPrismaLeadRole(role: LeadRoleValue): LeadRole {
  return role as LeadRole;
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
}) {
  const email = normalizeLeadEmail(params.email);
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, accountRole: true, playerFirstName: true, accountHolderName: true },
  });

  const lead = await prisma.lead.upsert({
    where: { email },
    create: {
      email,
      firstName: params.firstName.trim(),
      role: toPrismaLeadRole(params.role),
      source: params.source ?? "resources",
      firstResourceSlug: params.resourceSlug,
      userId: existingUser?.id ?? null,
      emailProvidedByParent: params.emailProvidedByParent ?? false,
    },
    update: {
      firstName: params.firstName.trim(),
      role: toPrismaLeadRole(params.role),
      userId: existingUser?.id ?? undefined,
      ...(params.emailProvidedByParent ? { emailProvidedByParent: true } : {}),
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
