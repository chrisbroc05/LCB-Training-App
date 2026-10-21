import { COACH_CALENDLY_URL } from "@/lib/coach-calendly-shared";
import type { LeadRoleValue, ResourceDefinition } from "@/lib/resources-shared";

export const LEAD_COOKIE_NAME = "lcb_lead_id";
export const LEAD_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

export type ResourceLeadActionResult =
  | { action: "download"; downloadUrl: string; leadId: string }
  | { action: "redirect"; url: string; leadId: string }
  | { action: "checkout"; url: string; leadId: string };

export function getResourceLeadSubmitLabel(resource: ResourceDefinition) {
  if (resource.type === "FREE_DOWNLOAD") {
    return "Get the Free PDF";
  }
  if (resource.type === "PAID_DOWNLOAD") {
    return "Continue to Checkout";
  }
  if (resource.slug === "book-a-call") {
    return "Book My Call";
  }
  if (resource.slug === "free-swing-analysis") {
    return "Continue to Sign Up";
  }
  if (resource.slug === "player-iq-quiz") {
    return "Take the Quiz";
  }
  return resource.buttonLabel;
}

export function buildCalendlyUrlWithLead(firstName: string, email: string) {
  const base = COACH_CALENDLY_URL;
  const url = new URL(base);
  url.searchParams.set("name", firstName.trim());
  url.searchParams.set("email", email.trim().toLowerCase());
  return url.toString();
}

export function mapLeadRoleToSignupRole(role: LeadRoleValue): "PLAYER" | "PARENT" {
  if (role === "PARENT") {
    return "PARENT";
  }
  return "PLAYER";
}

export function buildSwingAnalysisSignupUrl(params: {
  firstName: string;
  email: string;
  role: LeadRoleValue;
}) {
  const signupRole = mapLeadRoleToSignupRole(params.role);
  const query = new URLSearchParams({
    mode: "signup",
    redirect: "/swing-analysis",
    email: params.email.trim().toLowerCase(),
    firstName: params.firstName.trim(),
    signupRole: signupRole,
  });
  return `/auth?${query.toString()}`;
}

export function buildProgramLinkUrl(params: { email: string; firstName: string }) {
  const query = new URLSearchParams({
    email: params.email.trim().toLowerCase(),
    firstName: params.firstName.trim(),
  });
  return `/program?${query.toString()}`;
}

export function buildPlaybookLinkUrl(params: { email: string; firstName: string }) {
  const query = new URLSearchParams({
    email: params.email.trim().toLowerCase(),
    firstName: params.firstName.trim(),
  });
  return `/playbook?${query.toString()}`;
}

export function buildDetailsLinkUrl(params: { email: string; firstName: string }) {
  const query = new URLSearchParams({
    email: params.email.trim().toLowerCase(),
    firstName: params.firstName.trim(),
  });
  return `/details?${query.toString()}`;
}

export function isPaidResourceSlug(slug: string, type: ResourceDefinition["type"]) {
  return type === "PAID_DOWNLOAD";
}
