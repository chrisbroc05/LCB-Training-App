import "server-only";

import { buildAdminTodaySnapshot } from "@/lib/admin-today-server";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";
import type { AdminSectionHubCard } from "@/lib/admin-section-hub-shared";
import { prisma } from "@/lib/prisma";
import { getChicagoDayEnd, getChicagoDayStart } from "@/lib/program-email-chicago";
import { getChicagoTodayDateKey } from "@/lib/program-schedule";

export async function loadContentHubCards(now = new Date()): Promise<AdminSectionHubCard[]> {
  const todayKey = getChicagoTodayDateKey(now);
  const monthStart = getChicagoDayStart(
    getChicagoTodayDateKey(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)),
  );

  const [
    starterDrills,
    quizCompleted,
    resourceClicks30d,
    programCues,
    fixItGrants,
  ] = await Promise.all([
    prisma.drillLibraryCatalog.count({ where: { isStarterDrill: true } }),
    prisma.quizAttempt.count({ where: { completedAt: { not: null } } }),
    prisma.leadResource.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.coachCue.count(),
    prisma.userFixItGrant.count(),
  ]);

  return [
    {
      href: ADMIN_ROUTES.content.drillLibrary,
      title: "Drill library",
      description: "Starter drills new Playbook buyers can access on the public catalog.",
      statValue: String(starterDrills),
      statLabel: "Starter drills enabled",
    },
    {
      href: ADMIN_ROUTES.content.quiz,
      title: "Player IQ Quiz",
      description: "Completion stats, question accuracy, and every attempt with full answers.",
      statValue: String(quizCompleted),
      statLabel: "Completed attempts",
    },
    {
      href: ADMIN_ROUTES.content.resources,
      title: "Resources",
      description: "Clicks, downloads, checkouts, purchases, and revenue for each /resources card.",
      statValue: String(resourceClicks30d),
      statLabel: "Clicks last 30 days",
    },
    {
      href: ADMIN_ROUTES.content.programCues,
      title: "Program hitting focuses",
      description: "My Hitting Focuses library for 12-week program days.",
      statValue: String(programCues),
      statLabel: "Focus presets",
    },
    {
      href: ADMIN_ROUTES.content.fixIt,
      title: "Fix-It plans",
      description: "How Fix-It access works and member grants managed from the CRM.",
      statValue: String(fixItGrants),
      statLabel: "Active member grants",
    },
    {
      href: ADMIN_ROUTES.content.appHighlight,
      title: "App highlight",
      description: "Social and marketing asset for the app highlight PDF.",
      statValue: "1",
      statLabel: "Highlight kit",
    },
  ];
}

export async function loadCoachingHubCards(now = new Date()): Promise<AdminSectionHubCard[]> {
  const snapshot = await buildAdminTodaySnapshot(now);
  const [programActive, reflectionsShared] = await Promise.all([
    prisma.programEnrollment.count({
      where: { status: "ACTIVE", onboardingCompletedAt: { not: null } },
    }),
    prisma.playbookReflection.count({ where: { sharedWithCoach: true } }),
  ]);

  return [
    {
      href: ADMIN_ROUTES.coaching.reviews,
      title: "Video reviews",
      description: "Swing and mental submissions waiting for a coach video response.",
      statValue: String(snapshot.videoReviewsWaiting),
      statLabel: "Waiting now",
    },
    {
      href: ADMIN_ROUTES.coaching.reports,
      title: "Written reports",
      description: "Quick written evaluations and PDF reports to send.",
      statValue: String(snapshot.writtenReportsWaiting),
      statLabel: "Waiting now",
    },
    {
      href: ADMIN_ROUTES.coaching.goalCheckins,
      title: "Goal check-ins",
      description: "Monthly player goal submissions to respond to.",
      statValue: String(snapshot.attention.pendingGoalCheckinsCount),
      statLabel: "Pending",
    },
    {
      href: ADMIN_ROUTES.messages,
      title: "Messages",
      description: "Direct conversations with unread coach messages.",
      statValue: String(snapshot.unreadMessagesCount),
      statLabel: "Unread",
    },
    {
      href: ADMIN_ROUTES.coaching.program,
      title: "Program players",
      description: "12-week enrollments, setup queue, and player progress.",
      statValue: String(programActive),
      statLabel: "Active players",
    },
    {
      href: ADMIN_ROUTES.coaching.playbookReflections,
      title: "Playbook reflections",
      description: "Reflections players shared with you from the Next Level Playbook.",
      statValue: String(reflectionsShared),
      statLabel: "Shared with coach",
    },
  ];
}

export async function loadPlayersHubCards(): Promise<AdminSectionHubCard[]> {
  const [members, freeAccounts, orgs, waivers] = await Promise.all([
    prisma.user.count({ where: { isTestAccount: false, membershipTier: { not: "FREE" } } }),
    prisma.user.count({ where: { isTestAccount: false, membershipTier: "FREE" } }),
    prisma.organization.count({ where: { active: true } }),
    prisma.waiverSignature.count(),
  ]);

  return [
    {
      href: ADMIN_ROUTES.players.members,
      title: "Members",
      description: "Paid and coaching members, filters, and CRM detail.",
      statValue: String(members),
      statLabel: "Member accounts",
    },
    {
      href: ADMIN_ROUTES.players.free,
      title: "Free accounts",
      description: "Free-tier accounts and upgrade paths.",
      statValue: String(freeAccounts),
      statLabel: "Free accounts",
    },
    {
      href: ADMIN_ROUTES.players.organizations,
      title: "Organizations",
      description: "Org trials, teams, codes, and weekly focus.",
      statValue: String(orgs),
      statLabel: "Active orgs",
    },
    {
      href: ADMIN_ROUTES.players.waivers,
      title: "Waivers",
      description: "Signed waivers and export.",
      statValue: String(waivers),
      statLabel: "Signatures",
    },
    {
      href: ADMIN_ROUTES.players.testing,
      title: "Team testing",
      description: "Testing sessions, metrics, and player profiles.",
      statValue: "Open",
      statLabel: "Testing workspace",
    },
  ];
}

export async function loadBusinessHubCards(now = new Date()): Promise<AdminSectionHubCard[]> {
  const todayKey = getChicagoTodayDateKey(now);
  const start = getChicagoDayStart(todayKey);
  const end = getChicagoDayEnd(todayKey);

  const [leadsTotal, salesToday] = await Promise.all([
    prisma.lead.count(),
    prisma.resourcePurchase.count({ where: { createdAt: { gte: start, lt: end }, refundedAt: null } }),
  ]);

  return [
    {
      href: ADMIN_ROUTES.business.leads,
      title: "Leads",
      description: "Resource funnel leads with detail pages for every touchpoint.",
      statValue: String(leadsTotal),
      statLabel: "Total leads",
    },
    {
      href: ADMIN_ROUTES.business.sales,
      title: "Sales",
      description: "Paid resource purchases and Stripe sessions.",
      statValue: String(salesToday),
      statLabel: "Sales today",
    },
    {
      href: ADMIN_ROUTES.business.grants,
      title: "Product grants",
      description: "Manual product and program access grants.",
      statValue: "Email",
      statLabel: "Grant by email",
    },
  ];
}

export async function loadSettingsHubCards(): Promise<AdminSectionHubCard[]> {
  return [
    {
      href: ADMIN_ROUTES.settings.coaching,
      title: "Coaching",
      description: "Coaching submission rules and free swing analysis mode.",
      statValue: "Edit",
      statLabel: "Coaching settings",
    },
    {
      href: ADMIN_ROUTES.settings.alerts,
      title: "Coach alerts",
      description: "Email and push alert preferences for coach notifications.",
      statValue: "Edit",
      statLabel: "Alert settings",
    },
    {
      href: ADMIN_ROUTES.settings.programEmail,
      title: "Program email",
      description: "12-week program automated email controls.",
      statValue: "Edit",
      statLabel: "Program email",
    },
    {
      href: ADMIN_ROUTES.settings.videoPosters,
      title: "Video posters",
      description: "Poster backlog and apply tool for submission videos.",
      statValue: "Open",
      statLabel: "Video posters",
    },
  ];
}
