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
  memberCount: number;
  codes: AdminOrganizationCodeRecord[];
  teams: AdminOrganizationTeamRecord[];
  commissionAttributionCount: number;
};

export function slugifyOrganizationName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
