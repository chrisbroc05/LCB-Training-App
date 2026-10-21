import { COACH_CALENDLY_URL } from "@/lib/coach-calendly-shared";
import { TWELVE_WEEK_PROGRAM_CARD_DESCRIPTION } from "@/lib/twelve-week-program-copy-shared";

export type ResourceTag = "FREE" | "PAID";
export type ResourceType = "FREE_DOWNLOAD" | "PAID_DOWNLOAD" | "LINK";

/** Shown at checkout for instant PDF / digital resource purchases. */
export const DIGITAL_PRODUCT_SALES_FINAL_NOTICE = "Digital product. All sales are final.";
export type ResourceSection = "START_HERE" | "COACHING" | "WORKOUT_STARTERS" | "PROGRAMS_AND_GUIDES";
export type ResourceBadge = "START HERE" | "COACH'S PICK" | "BEST VALUE";
export type LeadRoleValue = "PLAYER" | "PARENT" | "COACH";

export const LEAD_ROLE_OPTIONS: { value: LeadRoleValue; label: string }[] = [
  { value: "PLAYER", label: "Player (13+)" },
  { value: "PARENT", label: "Parent" },
  { value: "COACH", label: "Coach" },
];

export type ResourceDefinition = {
  slug: string;
  title: string;
  description: string;
  tag: ResourceTag;
  badge?: ResourceBadge;
  priceDisplay?: string;
  section: ResourceSection;
  buttonLabel: string;
  type: ResourceType;
  linkHref?: string;
  stripePriceEnvVar?: string;
  /** Paths under private/ (guides/ or resources/starters/) */
  downloadFileKeys?: string[];
  sortOrder: number;
  /** Omit from the public /resources card grid (e.g. bottom CTA only). */
  hideFromResourcesHub?: boolean;
};

export const RESOURCE_SECTION_LABELS: Record<ResourceSection, string> = {
  START_HERE: "Start here",
  COACHING: "Coaching",
  WORKOUT_STARTERS: "4-week workout starters",
  PROGRAMS_AND_GUIDES: "Programs and guides",
};

const AGE_GROUPS = ["8-11", "12-15", "16-18"] as const;

function starterKeys(prefix: string) {
  return AGE_GROUPS.map((age) => `resources/starters/${prefix}_${age}_4Week_Starter.pdf`);
}

export const RESOURCE_DEFINITIONS: ResourceDefinition[] = [
  {
    slug: "free-swing-analysis",
    title: "Free Swing Analysis",
    description:
      "Send me your swing. I'll break it down personally and send back the first thing to fix and a drill for it. Free account required.",
    tag: "FREE",
    badge: "START HERE",
    section: "START_HERE",
    buttonLabel: "Get My Free Analysis",
    type: "LINK",
    linkHref: "/swing-analysis",
    sortOrder: 10,
  },
  {
    slug: "twelve-week-program",
    title: "12-Week Coaching Program",
    description: TWELVE_WEEK_PROGRAM_CARD_DESCRIPTION,
    tag: "PAID",
    badge: "COACH'S PICK",
    section: "COACHING",
    buttonLabel: "Start the Program",
    type: "LINK",
    linkHref: "/program",
    sortOrder: 20,
  },
  {
    slug: "player-iq-quiz",
    title: "The Player IQ Quiz",
    description:
      "15 questions on mindset, game situations, and training. Most players don't score as high as they think. See where you stand.",
    tag: "FREE",
    section: "START_HERE",
    buttonLabel: "Take the Quiz",
    type: "LINK",
    linkHref: "/quiz",
    sortOrder: 25,
  },
  {
    slug: "starter-arm-care",
    title: "Arm Care Routine: 4-Week Starter",
    description:
      "The band and mobility routine I use to keep arms healthy all season. 4 days a week, with a checklist. For pitchers, catchers, and position players.",
    tag: "FREE",
    section: "START_HERE",
    buttonLabel: "Get the Free PDF",
    type: "FREE_DOWNLOAD",
    downloadFileKeys: ["resources/starters/LCB_Arm_Care_4Week_Starter.pdf"],
    sortOrder: 30,
  },
  {
    slug: "starter-strength",
    title: "Strength: 4-Week Starter",
    description:
      "The first 4 weeks of my strength program, by age (8-11, 12-15, 16+). Learn the key lifts with good form and build your base.",
    tag: "PAID",
    priceDisplay: "$10",
    section: "WORKOUT_STARTERS",
    buttonLabel: "Get the Starter",
    type: "PAID_DOWNLOAD",
    stripePriceEnvVar: "STRIPE_PRICE_RES_STRENGTH",
    downloadFileKeys: starterKeys("LCB_Strength"),
    sortOrder: 40,
  },
  {
    slug: "fix-it-hitting-plans",
    title: "Fix-It Hitting Plans",
    description:
      "Front shoulder flying open? Hips drifting? Two 3-week plans off a tee or flips with my drill videos.",
    tag: "PAID",
    priceDisplay: "$19 each",
    section: "WORKOUT_STARTERS",
    buttonLabel: "See the Plans",
    type: "LINK",
    linkHref: "/fix-it",
    sortOrder: 45,
  },
  {
    slug: "fixit-stay-closed",
    title: "Stay Closed: Fix Your Front Shoulder",
    description: "3-week Fix-It plan with drill videos and a day-by-day PDF.",
    tag: "PAID",
    priceDisplay: "$19",
    section: "WORKOUT_STARTERS",
    buttonLabel: "Get Stay Closed",
    type: "PAID_DOWNLOAD",
    stripePriceEnvVar: "STRIPE_PRICE_RES_FIXIT_SHOULDER",
    downloadFileKeys: ["resources/fix-it/LCB_FixIt_Stay_Closed.pdf"],
    sortOrder: 46,
    hideFromResourcesHub: true,
  },
  {
    slug: "fixit-hit-the-brakes",
    title: "Hit the Brakes: Stop Drifting, Stay Stacked",
    description: "3-week Fix-It plan with drill videos and a day-by-day PDF.",
    tag: "PAID",
    priceDisplay: "$19",
    section: "WORKOUT_STARTERS",
    buttonLabel: "Get Hit the Brakes",
    type: "PAID_DOWNLOAD",
    stripePriceEnvVar: "STRIPE_PRICE_RES_FIXIT_BRAKES",
    downloadFileKeys: ["resources/fix-it/LCB_FixIt_Hit_the_Brakes.pdf"],
    sortOrder: 47,
    hideFromResourcesHub: true,
  },
  {
    slug: "pregame-warmup",
    title: "Pregame Warm-Up Routine",
    description:
      "The warm-up I give every team. Get loose, get your arm ready, and show up locked in from the first pitch.",
    tag: "FREE",
    section: "START_HERE",
    buttonLabel: "Get the Free PDF",
    type: "FREE_DOWNLOAD",
    downloadFileKeys: ["guides/LCB_PreGame_Warmup.pdf"],
    sortOrder: 50,
  },
  {
    slug: "starter-bundle",
    title: "4-Week Starter Bundle",
    description:
      "Strength, Speed and Agility, and Mobility starters in one download. Every age group included.",
    tag: "PAID",
    badge: "BEST VALUE",
    priceDisplay: "$25",
    section: "WORKOUT_STARTERS",
    buttonLabel: "Get the Bundle",
    type: "PAID_DOWNLOAD",
    stripePriceEnvVar: "STRIPE_PRICE_RES_STARTER_BUNDLE",
    downloadFileKeys: [
      ...starterKeys("LCB_Strength"),
      ...starterKeys("LCB_Speed-Agility"),
      ...starterKeys("LCB_Mobility"),
    ],
    sortOrder: 60,
  },
  {
    slug: "parent-guide",
    title: "The Parent Guide",
    description:
      "How to help your player develop without adding pressure, and what gets in the way.",
    tag: "FREE",
    section: "START_HERE",
    buttonLabel: "Get the Free PDF",
    type: "FREE_DOWNLOAD",
    downloadFileKeys: ["guides/LCB_Parent_Guide.pdf"],
    sortOrder: 70,
  },
  {
    slug: "next-level-playbook",
    title: "The Next Level Playbook",
    description:
      "My mindset system for players who want to be known for more than stats. Plus starter drills, 4 guides, and 1 swing review from me.",
    tag: "PAID",
    section: "PROGRAMS_AND_GUIDES",
    buttonLabel: "Get the Playbook",
    type: "LINK",
    linkHref: "/playbook",
    sortOrder: 80,
  },
  {
    slug: "starter-speed",
    title: "Speed and Agility: 4-Week Starter",
    description:
      "The first 4 weeks of my speed program, by age. First-step quickness, acceleration, and change of direction.",
    tag: "PAID",
    priceDisplay: "$10",
    section: "WORKOUT_STARTERS",
    buttonLabel: "Get the Starter",
    type: "PAID_DOWNLOAD",
    stripePriceEnvVar: "STRIPE_PRICE_RES_SPEED",
    downloadFileKeys: starterKeys("LCB_Speed-Agility"),
    sortOrder: 90,
  },
  {
    slug: "nutrition-guide",
    title: "Nutrition and Fueling Guide",
    description:
      "What to eat before and after games to fuel your energy and recover. Simple game-day nutrition for busy baseball families.",
    tag: "FREE",
    section: "START_HERE",
    buttonLabel: "Get the Free PDF",
    type: "FREE_DOWNLOAD",
    downloadFileKeys: ["guides/LCB_Nutrition_Guide.pdf"],
    sortOrder: 100,
  },
  {
    slug: "starter-back-arm",
    title: "Back and Arm Strength: 4-Week Starter",
    description:
      "Two days a week: back and pulling strength, then arms and grip. Home and school gym options.",
    tag: "PAID",
    priceDisplay: "$10",
    section: "PROGRAMS_AND_GUIDES",
    buttonLabel: "Get the Starter",
    type: "PAID_DOWNLOAD",
    stripePriceEnvVar: "STRIPE_PRICE_RES_BACK_ARM",
    downloadFileKeys: ["resources/starters/LCB_Back_and_Arm_4Week_Starter.pdf"],
    sortOrder: 110,
  },
  {
    slug: "starter-mobility",
    title: "Mobility: 4-Week Starter",
    description:
      "The first 4 weeks of my mobility program, by age. Move better through your hips, upper back, and shoulders.",
    tag: "PAID",
    priceDisplay: "$10",
    section: "WORKOUT_STARTERS",
    buttonLabel: "Get the Starter",
    type: "PAID_DOWNLOAD",
    stripePriceEnvVar: "STRIPE_PRICE_RES_MOBILITY",
    downloadFileKeys: starterKeys("LCB_Mobility"),
    sortOrder: 120,
  },
  {
    slug: "recruiting-guide",
    title: "College Baseball Recruiting Guide",
    description:
      "How college recruiting really works and what to do each year of high school to get noticed.",
    tag: "PAID",
    priceDisplay: "$19",
    section: "PROGRAMS_AND_GUIDES",
    buttonLabel: "Get the Guide",
    type: "PAID_DOWNLOAD",
    stripePriceEnvVar: "STRIPE_PRICE_RES_RECRUITING",
    downloadFileKeys: ["guides/LCB_Recruiting_Guide.pdf"],
    sortOrder: 130,
  },
  {
    slug: "rotational-sample",
    title: "Rotational Power Sample",
    description:
      "A free sample of my rotational power work. Exercises to help you create more power from the ground up.",
    tag: "FREE",
    section: "START_HERE",
    buttonLabel: "Get the Free PDF",
    type: "FREE_DOWNLOAD",
    downloadFileKeys: ["guides/LCB_Rotational_Sample.pdf"],
    sortOrder: 140,
  },
  {
    slug: "mental-game-workbook",
    title: "Mental Game Workbook",
    description:
      "Worksheets to build your routines, handle pressure, and bounce back from a bad game.",
    tag: "PAID",
    priceDisplay: "$10",
    section: "PROGRAMS_AND_GUIDES",
    buttonLabel: "Get the Workbook",
    type: "PAID_DOWNLOAD",
    stripePriceEnvVar: "STRIPE_PRICE_RES_MENTAL",
    downloadFileKeys: ["guides/LCB_Mental_Game_Workbook.pdf"],
    sortOrder: 150,
  },
  {
    slug: "lessons-program-bundle",
    title: "Lessons + Program Bundle",
    description:
      "12 in-person lessons plus the full 12-Week Program. Chicagoland only.",
    tag: "PAID",
    section: "COACHING",
    buttonLabel: "Learn More",
    type: "LINK",
    linkHref: "/details",
    sortOrder: 160,
  },
  {
    slug: "remote-session",
    title: "Online Remote Session",
    description: "A live one-on-one video session with me. Book your time right after checkout.",
    tag: "PAID",
    section: "COACHING",
    buttonLabel: "Book a Session",
    type: "LINK",
    linkHref: "/remote",
    sortOrder: 170,
  },
  {
    slug: "book-a-call",
    title: "Book a Call",
    description: "Not sure where to start? Let's talk about your player.",
    tag: "FREE",
    section: "START_HERE",
    buttonLabel: "Book a Call",
    type: "LINK",
    linkHref: COACH_CALENDLY_URL,
    sortOrder: 180,
    hideFromResourcesHub: true,
  },
];

const resourceBySlug = new Map(RESOURCE_DEFINITIONS.map((resource) => [resource.slug, resource]));

export function getResourceDefinition(slug: string) {
  return resourceBySlug.get(slug);
}

export function getResourcesBySection(section: ResourceSection) {
  return RESOURCE_DEFINITIONS.filter((resource) => resource.section === section).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

export function getResourcesForHub() {
  return RESOURCE_DEFINITIONS.filter((resource) => !resource.hideFromResourcesHub).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

export const RESOURCES_HUB_ORDER_SLUGS = getResourcesForHub().map((resource) => resource.slug);

export function getPaidDownloadResourceSlugs() {
  return RESOURCE_DEFINITIONS.filter((resource) => resource.type === "PAID_DOWNLOAD").map(
    (resource) => resource.slug,
  );
}

export function getStripePriceIdForResourceSlug(slug: string) {
  const resource = getResourceDefinition(slug);
  if (!resource?.stripePriceEnvVar) {
    return null;
  }
  return process.env[resource.stripePriceEnvVar] ?? null;
}

export function getResourceDownloadLabel(fileKey: string) {
  const match = fileKey.match(/_(8-11|12-15|16-18)_4Week_Starter\.pdf$/);
  if (match) {
    const age = match[1] === "16-18" ? "16+" : match[1];
    if (fileKey.includes("Strength")) {
      return `Strength (ages ${age})`;
    }
    if (fileKey.includes("Speed-Agility")) {
      return `Speed and Agility (ages ${age})`;
    }
    if (fileKey.includes("Mobility")) {
      return `Mobility (ages ${age})`;
    }
  }
  const basename = fileKey.split("/").pop() ?? fileKey;
  return basename.replace(/^LCB_/, "").replace(/\.pdf$/, "").replace(/_/g, " ");
}

export const RESOURCES_PAGE_TITLE = "Free + Paid Resources | LCB Training";
export const RESOURCES_PAGE_DESCRIPTION =
  "Free tools and paid programs for players, parents, and coaches from Coach Broc at LCB Training.";
