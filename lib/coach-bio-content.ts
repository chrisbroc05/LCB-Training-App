import raw from "@/content/coach-bio.json";
import { COACH_CALENDLY_URL } from "@/lib/coach-calendly-shared";

export type CoachBioOffering = {
  title: string;
  description: string;
  summary: string;
};

export type CoachBioContent = {
  displayName: string;
  titleLine: string;
  location: string;
  slogan: string;
  aboutParagraphs: string[];
  aboutSummary: string;
  accolades: string[];
  experience: string[];
  philosophy: string;
  philosophySummary: string;
  offerings: CoachBioOffering[];
  contact: {
    calendlyUrl: string;
    email: string;
    website: string;
    websiteUrl: string;
    instagramHandle: string;
  };
  pdfDownloadPath: string;
  coachPhotoPath: string;
};

export const coachBioContent = raw as CoachBioContent;

export const COACH_BIO_PDF_HREF = coachBioContent.pdfDownloadPath;

/** Public URL for optional headshot (file may not exist at build time). */
export const COACH_PHOTO_PUBLIC_PATH = "/images/coach-broc.jpg";

export const coachBioCalendlyUrl = COACH_CALENDLY_URL;

export type CoachOfferingLinkKind = "internal" | "calendly";

export type CoachOfferingLink = {
  kind: CoachOfferingLinkKind;
  href: string;
  cardCta?: string;
};

const offeringLinkByTitle: Record<string, CoachOfferingLink> = {
  "Team Training and Clinics": { kind: "internal", href: "/details" },
  "Testing Days": { kind: "internal", href: "/details" },
  "Club Development Partnerships": {
    kind: "calendly",
    href: COACH_CALENDLY_URL,
    cardCta: "Let's talk",
  },
  "12-Week Coaching Program": { kind: "internal", href: "/program" },
  "Private and Small-Group Lessons": { kind: "internal", href: "/details" },
};

export function getCoachOfferingLink(title: string): CoachOfferingLink | null {
  return offeringLinkByTitle[title] ?? null;
}

export const coachBioPageDescription =
  "Player development coach Chris Broccolino (Coach Broc) - team training, testing days, club partnerships, and the 12-Week Coaching Program.";
