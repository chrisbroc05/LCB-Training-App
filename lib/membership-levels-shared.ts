/**
 * Display names, prices (display only), and copy for membership levels (client-safe).
 *
 * Phase 2: set PUBLIC_MEMBERSHIP_LEVELS_ENABLED to true and add
 * PublicMembershipLevelsSection to the landing or upgrade page to show the grid.
 */

/** When false, visitors never see Core / Plus / All-Access prices or signup (Phase 2 + Stripe). */
export const PUBLIC_MEMBERSHIP_LEVELS_ENABLED = true;

export const PUBLIC_MEMBERSHIP_UPGRADE_GENERIC_LABEL =
  "Upgrade for more access in the app.";

export function isPublicMembershipLevelsEnabled(): boolean {
  return PUBLIC_MEMBERSHIP_LEVELS_ENABLED;
}

export const MEMBERSHIP_LEVEL_KEYS = ["CORE", "PLUS", "ALL_ACCESS"] as const;

export type MembershipLevelKey = (typeof MEMBERSHIP_LEVEL_KEYS)[number];

export type MembershipLevelDefinition = {
  key: MembershipLevelKey;
  displayName: string;
  tagline: string;
  priceDisplay: string;
  shortDescription: string;
};

export const MEMBERSHIP_LEVELS: Record<MembershipLevelKey, MembershipLevelDefinition> = {
  CORE: {
    key: "CORE",
    displayName: "Core",
    tagline: "The essentials to start building.",
    priceDisplay: "$10/mo",
    shortDescription:
      "Starter drills, 4-week workouts in the app, key guides, and a quick written swing report every 6 weeks.",
  },
  PLUS: {
    key: "PLUS",
    displayName: "Plus",
    tagline: "Coach Broc in your corner.",
    priceDisplay: "$20/mo",
    shortDescription:
      "Full drill library, full workout programs, Playbook and guides, monthly in-depth video review, and messaging.",
  },
  ALL_ACCESS: {
    key: "ALL_ACCESS",
    displayName: "All-Access",
    tagline: "Full access to Coach Broc.",
    priceDisplay: "$249/mo",
    shortDescription:
      "Everything in Plus, recruiting guide, your personal daily plan with no end date, and priority coaching.",
  },
};

export function isMembershipLevelKey(value: string): value is MembershipLevelKey {
  return (MEMBERSHIP_LEVEL_KEYS as readonly string[]).includes(value);
}

export function formatMembershipLevelLabel(key: MembershipLevelKey): string {
  return MEMBERSHIP_LEVELS[key].displayName;
}

export function getUpgradeLabelForLevel(requiredLevel: MembershipLevelKey): string {
  if (!PUBLIC_MEMBERSHIP_LEVELS_ENABLED) {
    return PUBLIC_MEMBERSHIP_UPGRADE_GENERIC_LABEL;
  }
  return `Available with ${MEMBERSHIP_LEVELS[requiredLevel].displayName}`;
}

/** Levels safe to render on marketing pages (empty until Phase 2). */
export function listPublicMembershipLevelDefinitions(): MembershipLevelDefinition[] {
  if (!PUBLIC_MEMBERSHIP_LEVELS_ENABLED) {
    return [];
  }
  return MEMBERSHIP_LEVEL_KEYS.map((key) => MEMBERSHIP_LEVELS[key]);
}
