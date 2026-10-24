import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export type AdminNavItem = {
  href: string;
  label: string;
  matchPrefix: string;
};

export type AdminNavSection = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    id: "coaching",
    label: "Coaching",
    items: [
      { href: ADMIN_ROUTES.coaching.hub, label: "Coaching home", matchPrefix: ADMIN_ROUTES.coaching.hub },
      { href: ADMIN_ROUTES.coaching.reviews, label: "Video reviews", matchPrefix: ADMIN_ROUTES.coaching.reviews },
      { href: ADMIN_ROUTES.coaching.reports, label: "Written reports", matchPrefix: ADMIN_ROUTES.coaching.reports },
      { href: ADMIN_ROUTES.coaching.goalCheckins, label: "Goal check-ins", matchPrefix: ADMIN_ROUTES.coaching.goalCheckins },
      { href: ADMIN_ROUTES.messages, label: "Messages", matchPrefix: ADMIN_ROUTES.messages },
      { href: ADMIN_ROUTES.coaching.program, label: "Program players", matchPrefix: `${ADMIN_ROUTES.coaching.program}` },
      {
        href: ADMIN_ROUTES.coaching.playbookReflections,
        label: "Playbook reflections",
        matchPrefix: ADMIN_ROUTES.coaching.playbookReflections,
      },
    ],
  },
  {
    id: "players",
    label: "Players",
    items: [
      { href: ADMIN_ROUTES.players.hub, label: "Players home", matchPrefix: ADMIN_ROUTES.players.hub },
      { href: ADMIN_ROUTES.players.members, label: "Members", matchPrefix: ADMIN_ROUTES.players.members },
      { href: ADMIN_ROUTES.players.free, label: "Free accounts", matchPrefix: ADMIN_ROUTES.players.free },
      { href: ADMIN_ROUTES.players.organizations, label: "Organizations", matchPrefix: ADMIN_ROUTES.players.organizations },
      { href: ADMIN_ROUTES.players.waivers, label: "Waivers", matchPrefix: ADMIN_ROUTES.players.waivers },
      { href: ADMIN_ROUTES.players.testing, label: "Team testing", matchPrefix: "/admin/testing" },
    ],
  },
  {
    id: "content",
    label: "Content",
    items: [
      { href: ADMIN_ROUTES.content.hub, label: "Content home", matchPrefix: ADMIN_ROUTES.content.hub },
      { href: ADMIN_ROUTES.content.drillLibrary, label: "Drill library", matchPrefix: ADMIN_ROUTES.content.drillLibrary },
      { href: ADMIN_ROUTES.content.resources, label: "Resources stats", matchPrefix: ADMIN_ROUTES.content.resources },
      { href: ADMIN_ROUTES.content.programCues, label: "Program focuses", matchPrefix: ADMIN_ROUTES.content.programCues },
      { href: ADMIN_ROUTES.content.quiz, label: "Player IQ Quiz", matchPrefix: ADMIN_ROUTES.content.quiz },
      { href: ADMIN_ROUTES.content.appHighlight, label: "App highlight", matchPrefix: ADMIN_ROUTES.content.appHighlight },
      { href: ADMIN_ROUTES.content.fixIt, label: "Fix-It plans", matchPrefix: ADMIN_ROUTES.content.fixIt },
    ],
  },
  {
    id: "business",
    label: "Business",
    items: [
      { href: ADMIN_ROUTES.business.hub, label: "Business home", matchPrefix: ADMIN_ROUTES.business.hub },
      { href: ADMIN_ROUTES.business.leads, label: "Leads", matchPrefix: ADMIN_ROUTES.business.leads },
      { href: ADMIN_ROUTES.business.sales, label: "Sales", matchPrefix: ADMIN_ROUTES.business.sales },
      { href: ADMIN_ROUTES.business.grants, label: "Product grants", matchPrefix: ADMIN_ROUTES.business.grants },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    items: [
      { href: ADMIN_ROUTES.settings.hub, label: "Settings home", matchPrefix: ADMIN_ROUTES.settings.hub },
      { href: ADMIN_ROUTES.settings.coaching, label: "Coaching", matchPrefix: ADMIN_ROUTES.settings.coaching },
      { href: ADMIN_ROUTES.settings.alerts, label: "Coach alerts", matchPrefix: ADMIN_ROUTES.settings.alerts },
      { href: ADMIN_ROUTES.settings.programEmail, label: "Program email", matchPrefix: ADMIN_ROUTES.settings.programEmail },
      { href: ADMIN_ROUTES.settings.videoPosters, label: "Video posters", matchPrefix: ADMIN_ROUTES.settings.videoPosters },
    ],
  },
];

export const ADMIN_MOBILE_TABS = [
  { id: "today", href: ADMIN_ROUTES.today, label: "Today", matchPrefix: "/admin" },
  { id: "coaching", href: ADMIN_ROUTES.coaching.hub, label: "Coaching", matchPrefix: "/admin/coaching" },
  { id: "players", href: ADMIN_ROUTES.players.hub, label: "Players", matchPrefix: "/admin/players" },
  { id: "content", href: ADMIN_ROUTES.content.hub, label: "Content", matchPrefix: "/admin/content" },
  { id: "more", href: "/admin/more", label: "More", matchPrefix: "/admin/more" },
] as const;

export function isAdminTodayPath(pathname: string) {
  if (pathname === ADMIN_ROUTES.today) {
    return true;
  }
  if (pathname.startsWith("/admin/settings")) {
    return false;
  }
  if (pathname.startsWith("/admin/coaching")) {
    return false;
  }
  if (pathname.startsWith("/admin/players")) {
    return false;
  }
  if (pathname.startsWith("/admin/content")) {
    return false;
  }
  if (pathname.startsWith("/admin/business")) {
    return false;
  }
  if (pathname.startsWith("/admin/messages")) {
    return false;
  }
  if (pathname.startsWith("/admin/testing")) {
    return false;
  }
  return pathname === "/admin";
}

export function adminMobileTabActive(pathname: string, tab: (typeof ADMIN_MOBILE_TABS)[number]) {
  if (tab.id === "today") {
    return pathname === "/admin";
  }
  if (tab.id === "more") {
    return (
      pathname.startsWith("/admin/more") ||
      pathname.startsWith("/admin/business") ||
      pathname.startsWith("/admin/settings")
    );
  }
  return pathname.startsWith(tab.matchPrefix);
}
