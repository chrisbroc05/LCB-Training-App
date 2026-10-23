/**
 * Admin portal paths (client-safe). Use for links in emails, push payloads, and UI.
 */

export const ADMIN_ROUTES = {
  today: "/admin",
  coaching: {
    reviews: "/admin/coaching/reviews",
    reports: "/admin/coaching/reports",
    goalCheckins: "/admin/coaching/goal-checkins",
    playbookReflections: "/admin/coaching/playbook-reflections",
    program: "/admin/coaching/program",
    programPlayer: (enrollmentId: string) => `/admin/coaching/program/${enrollmentId}`,
  },
  messages: "/admin/messages",
  messageThread: (conversationId: string) => `/admin/messages/${conversationId}`,
  players: {
    members: "/admin/players/members",
    free: "/admin/players/free",
    organizations: "/admin/players/organizations",
    waivers: "/admin/players/waivers",
    testing: "/admin/testing",
  },
  content: {
    drillLibrary: "/admin/content/drill-library",
    programCues: "/admin/content/program-cues",
    quiz: "/admin/content/quiz",
    appHighlight: "/admin/content/app-highlight",
    fixIt: "/admin/content/fix-it",
  },
  business: {
    leads: "/admin/business/leads",
    sales: "/admin/business/sales",
    grants: "/admin/business/grants",
  },
  settings: {
    coaching: "/admin/settings/coaching",
    alerts: "/admin/settings/alerts",
    programEmail: "/admin/settings/program-email",
    videoPosters: "/admin/settings/video-posters",
  },
} as const;

export type CoachSubmissionTab = "swing" | "mental";

export function buildAdminCoachingReviewsUrl(tab: CoachSubmissionTab, submissionId: string) {
  const params = new URLSearchParams({ tab, submissionId });
  return `${ADMIN_ROUTES.coaching.reviews}?${params.toString()}`;
}

/** @deprecated Use buildAdminCoachingReviewsUrl */
export function buildAdminSubmissionUrl(tab: CoachSubmissionTab, submissionId: string) {
  return buildAdminCoachingReviewsUrl(tab, submissionId);
}

export function buildAdminProgramPlayerUrl(enrollmentId: string) {
  return ADMIN_ROUTES.coaching.programPlayer(enrollmentId);
}
