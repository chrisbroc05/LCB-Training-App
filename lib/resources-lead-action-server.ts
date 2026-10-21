import "server-only";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireCurrentTermsForCheckout } from "@/lib/legal-checkout-server";
import { upsertLeadForResourceDownload, normalizeLeadEmail } from "@/lib/leads-server";
import { prisma } from "@/lib/prisma";
import { createResourceDownloadToken } from "@/lib/resource-download-token";
import { sendResourceDeliveryEmail } from "@/lib/resource-emails-server";
import { getCalendlyBookingUrl } from "@/lib/calendly-booking";
import {
  buildCalendlyUrlWithLead,
  buildDetailsLinkUrl,
  buildPlaybookLinkUrl,
  buildProgramLinkUrl,
  buildSwingAnalysisSignupUrl,
  type ResourceLeadActionResult,
} from "@/lib/resources-lead-shared";
import {
  getResourceDefinition,
  getStripePriceIdForResourceSlug,
  type LeadRoleValue,
} from "@/lib/resources-shared";
import { stripe } from "@/lib/stripe";

function getBaseUrl(request: Request) {
  const configuredBaseUrl = process.env.NEXTAUTH_URL;
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }
  const origin = request.headers.get("origin");
  if (origin) {
    return origin;
  }
  throw new Error("Unable to resolve app base URL.");
}

async function resolveLeadContext(params: {
  leadId?: string | null;
  firstName?: string;
  email?: string;
  role?: LeadRoleValue;
  resourceSlug: string;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.id && session.user.email) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        name: true,
        playerFirstName: true,
        accountRole: true,
        accountHolderName: true,
      },
    });
    const email = session.user.email.toLowerCase();
    const firstName =
      user?.playerFirstName?.trim() ||
      user?.accountHolderName?.trim()?.split(/\s+/)[0] ||
      user?.name?.trim()?.split(/\s+/)[0] ||
      "Player";
    const role: LeadRoleValue =
      user?.accountRole === "PARENT" ? "PARENT" : "PLAYER";

    const { lead } = await upsertLeadForResourceDownload({
      email,
      firstName,
      role,
      resourceSlug: params.resourceSlug,
    });
    return { lead, firstName, email, userId: session.user.id };
  }

  if (params.leadId) {
    const lead = await prisma.lead.findUnique({
      where: { id: params.leadId },
      select: { id: true, email: true, firstName: true, role: true, unsubscribedAt: true },
    });
    if (lead && !lead.unsubscribedAt) {
      await prisma.leadResource.create({
        data: { leadId: lead.id, resourceSlug: params.resourceSlug },
      });
      return {
        lead,
        firstName: lead.firstName,
        email: lead.email,
        userId: null as string | null,
      };
    }
  }

  const email = params.email?.trim();
  const firstName = params.firstName?.trim();
  const role = params.role;
  if (!email || !firstName || !role) {
    throw new Error("MISSING_LEAD_FIELDS");
  }

  const { lead } = await upsertLeadForResourceDownload({
    email,
    firstName,
    role,
    resourceSlug: params.resourceSlug,
  });
  return { lead, firstName, email: normalizeLeadEmail(email), userId: null };
}

async function createGuestOrMemberCheckout(params: {
  request: Request;
  resourceSlug: string;
  email: string;
  leadId: string;
  userId: string | null;
}) {
  const resource = getResourceDefinition(params.resourceSlug);
  if (!resource || resource.type !== "PAID_DOWNLOAD") {
    throw new Error("Invalid paid resource.");
  }

  const priceId = getStripePriceIdForResourceSlug(resource.slug);
  if (!priceId) {
    throw new Error("Resource pricing is not configured.");
  }

  if (params.userId) {
    const termsError = await requireCurrentTermsForCheckout(params.userId);
    if (termsError) {
      throw new Error("TERMS_REQUIRED");
    }
  }

  const baseUrl = getBaseUrl(params.request);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: params.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/resources/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/resources?checkout=cancelled`,
    client_reference_id: params.userId ?? params.leadId,
    metadata: {
      purchaseType: "resource",
      resourceSlug: resource.slug,
      leadId: params.leadId,
      email: params.email,
      ...(params.userId ? { userId: params.userId } : {}),
    },
  });

  if (!checkoutSession.url) {
    throw new Error("Unable to create checkout session.");
  }

  const latestLeadResource = await prisma.leadResource.findFirst({
    where: { leadId: params.leadId, resourceSlug: params.resourceSlug },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (latestLeadResource) {
    await prisma.leadResource.update({
      where: { id: latestLeadResource.id },
      data: { checkoutStartedAt: new Date() },
    });
  }

  return checkoutSession.url;
}

async function createRemoteSessionCheckout(params: {
  request: Request;
  email: string;
  leadId: string;
  userId: string | null;
}) {
  const priceId = process.env.STRIPE_REMOTE_PRICE_ID;
  if (!priceId) {
    throw new Error("Remote session pricing is not configured.");
  }

  if (params.userId) {
    const termsError = await requireCurrentTermsForCheckout(params.userId);
    if (termsError) {
      throw new Error("TERMS_REQUIRED");
    }
  }

  const baseUrl = getBaseUrl(params.request);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: params.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: getCalendlyBookingUrl(),
    cancel_url: `${baseUrl}/resources?checkout=cancelled`,
    client_reference_id: params.userId ?? params.leadId,
    metadata: {
      purchaseType: "remote_session",
      email: params.email,
      leadId: params.leadId,
      ...(params.userId ? { userId: params.userId } : {}),
    },
  });

  if (!checkoutSession.url) {
    throw new Error("Unable to create checkout session.");
  }

  return checkoutSession.url;
}

export async function performResourceLeadAction(
  request: Request,
  body: {
    resourceSlug?: string;
    firstName?: string;
    email?: string;
    role?: LeadRoleValue;
    leadId?: string;
  },
): Promise<ResourceLeadActionResult> {
  const resourceSlug = body.resourceSlug?.trim() ?? "";
  const resource = getResourceDefinition(resourceSlug);
  if (!resource) {
    throw new Error("Invalid resource.");
  }

  const { lead, firstName, email, userId } = await resolveLeadContext({
    leadId: body.leadId,
    firstName: body.firstName,
    email: body.email,
    role: body.role,
    resourceSlug,
  });

  if (resource.type === "FREE_DOWNLOAD") {
    const primaryFileKey = resource.downloadFileKeys?.[0];
    if (!primaryFileKey) {
      throw new Error("Resource file missing.");
    }
    const downloadToken = createResourceDownloadToken({
      email,
      resourceSlug,
      fileKey: primaryFileKey,
    });
    void sendResourceDeliveryEmail({
      toEmail: email,
      firstName,
      resourceSlug,
      leadId: lead.id,
    }).catch((error) => {
      console.error("[lead-action] delivery email failed", error);
    });
    return {
      action: "download",
      downloadUrl: `/api/resources/download?token=${encodeURIComponent(downloadToken)}`,
      leadId: lead.id,
    };
  }

  if (resource.type === "PAID_DOWNLOAD") {
    const checkoutUrl = await createGuestOrMemberCheckout({
      request,
      resourceSlug,
      email,
      leadId: lead.id,
      userId,
    });
    return { action: "checkout", url: checkoutUrl, leadId: lead.id };
  }

  if (resource.slug === "free-swing-analysis") {
    if (userId) {
      return { action: "redirect", url: "/swing-analysis", leadId: lead.id };
    }
    const role = (body.role ?? lead.role) as LeadRoleValue;
    return {
      action: "redirect",
      url: buildSwingAnalysisSignupUrl({ firstName, email, role }),
      leadId: lead.id,
    };
  }

  if (resource.slug === "book-a-call") {
    return {
      action: "redirect",
      url: buildCalendlyUrlWithLead(firstName, email),
      leadId: lead.id,
    };
  }

  if (resource.slug === "twelve-week-program") {
    return {
      action: "redirect",
      url: buildProgramLinkUrl({ email, firstName }),
      leadId: lead.id,
    };
  }

  if (resource.slug === "player-iq-quiz") {
    return {
      action: "redirect",
      url: "/quiz",
      leadId: lead.id,
    };
  }

  if (resource.slug === "lessons-program-bundle") {
    return {
      action: "redirect",
      url: buildDetailsLinkUrl({ email, firstName }),
      leadId: lead.id,
    };
  }

  if (resource.slug === "next-level-playbook") {
    return {
      action: "redirect",
      url: buildPlaybookLinkUrl({ email, firstName }),
      leadId: lead.id,
    };
  }

  if (resource.slug === "remote-session") {
    const checkoutUrl = await createRemoteSessionCheckout({
      request,
      email,
      leadId: lead.id,
      userId,
    });
    return { action: "checkout", url: checkoutUrl, leadId: lead.id };
  }

  const href = resource.linkHref ?? "/resources";
  return {
    action: "redirect",
    url: href,
    leadId: lead.id,
  };
}
