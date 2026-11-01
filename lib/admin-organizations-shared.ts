import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import type { OrgBillingModeKey } from "@/lib/org-shared";

export type AdminOrganizationCodeRecord = {
  id: string;
  code: string;
  label: string | null;
  active: boolean;
};

export type AdminOrganizationTeamRecord = {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
  memberCount: number;
};

export type AdminOrganizationRecord = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  active: boolean;
  billingMode: OrgBillingModeKey;
  coveredLevel: MembershipLevelKey | null;
  trialStartsAt: string | null;
  trialEndsAt: string | null;
  trialLockedCopy: string | null;
  commissionRate: number;
  commissionMonths: number;
  ongoingCommissionRate: number;
  commissionEndsAt: string | null;
  foundingOfferEnabled: boolean;
  foundingOfferDeadline: string | null;
  foundingOfferMonths: number;
  foundingMemberCount: number;
  commissionableFamilies: number;
  notCommissionableFamilies: number;
  memberCount: number;
  codes: AdminOrganizationCodeRecord[];
  teams: AdminOrganizationTeamRecord[];
};

export function buildOrgFoundingOfferExplainer(foundingOfferMonths: number): string {
  const months = Math.max(1, Math.floor(foundingOfferMonths) || 12);
  return `Families in this club who start Plus monthly by the deadline pay $15/mo for ${months} months, then $20/mo.`;
}

export function formatAdminCommissionRate(rate: number): string {
  return `${Math.round(rate * 1000) / 10}%`;
}

export function buildAdminOrgCommissionsHref(orgId: string): string {
  return `/admin/business/commissions?orgId=${encodeURIComponent(orgId)}`;
}

export function isOrgCommissionConfigured(commissionRate: number): boolean {
  return commissionRate > 0;
}

export function slugifyOrganizationName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
