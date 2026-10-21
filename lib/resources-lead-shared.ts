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

export function buildProgramLinkUrl(email: string, startCheckout: boolean) {
  const query = new URLSearchParams();
  if (startCheckout) {
    query.set("startCheckout", "1");
  }
  query.set("email", email.trim().toLowerCase());
  return `/program?${query.toString()}`;
}

export function buildPlaybookLinkUrl(email: string) {
  const query = new URLSearchParams({
    startCheckout: "1",
    email: email.trim().toLowerCase(),
  });
  return `/playbook?${query.toString()}`;
}

export function buildRemoteLinkUrl(email: string) {
  const query = new URLSearchParams({
    startCheckout: "1",
    email: email.trim().toLowerCase(),
  });
  return `/remote?${query.toString()}`;
}

export function buildDetailsLinkUrl(email: string) {
  const query = new URLSearchParams({
    email: email.trim().toLowerCase(),
  });
  return `/details?${query.toString()}`;
}

export function isPaidResourceSlug(slug: string, type: ResourceDefinition["type"]) {
  return type === "PAID_DOWNLOAD";
}
