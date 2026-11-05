import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { type DatabaseTier } from "@/lib/membership";
import { isAdminEmail } from "@/lib/admin";
import {
  loadLoggedInLayoutAccess,
  type OrgTrialHeaderSummary,
} from "@/lib/layout-access-server";
import LoggedInSiteHeader from "@/app/components/LoggedInSiteHeader";
import SiteShell from "@/app/SiteShell";
import AppSplashScreen from "@/components/AppSplashScreen";
import PWAInstallHint from "@/components/PWAInstallHint";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import LegalAgreementGate from "@/components/LegalAgreementGate";
import OrgTeamReselectBanner from "@/app/components/OrgTeamReselectBanner";
import Under13ParentConsentGate from "@/components/Under13ParentConsentGate";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LCB Training",
    template: "%s | LCB Training",
  },
  description:
    "Baseball and softball player development with Coach Broc. Daily training plans and swing feedback between lessons.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const userDisplayName = session?.user?.name?.trim() ?? "";

  let membershipTier: DatabaseTier = "FREE";
  let currentPlanLabel = "Free";
  let hasDrillLibraryAccess = false;
  let hasPlaybookAccess = false;
  let hasMemberDownloadsAccess = false;
  let hasProgramEnrollment = false;
  let hasCoachingAccess = false;
  let orgTrialHeader: OrgTrialHeaderSummary | null = null;
  if (session?.user?.id) {
    const layoutAccess = await loadLoggedInLayoutAccess(session.user.id);
    membershipTier = layoutAccess.membershipTier;
    currentPlanLabel = layoutAccess.currentPlanLabel;
    hasDrillLibraryAccess = layoutAccess.hasDrillLibraryAccess;
    hasPlaybookAccess = layoutAccess.hasPlaybookAccess;
    hasMemberDownloadsAccess = layoutAccess.hasMemberDownloadsAccess;
    hasProgramEnrollment = layoutAccess.hasProgramEnrollment;
    hasCoachingAccess = layoutAccess.hasCoachingAccess;
    orgTrialHeader = layoutAccess.orgTrialHeader;
  }
  const hasAdminAccess = isAdminEmail(session?.user?.email);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LCB Training" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#0A1628" />
        {gaId ? (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${gaId}');
`,
              }}
            />
          </>
        ) : null}
      </head>
      <body className="min-h-full flex flex-col bg-black text-zinc-100">
        {session?.user?.id ? <OrgTeamReselectBanner userId={session.user.id} /> : null}
        <AppSplashScreen />
        <SiteShell
          isLoggedIn={Boolean(session?.user)}
          membershipTier={membershipTier}
          currentPlanLabel={currentPlanLabel}
          hasDrillLibraryAccess={hasDrillLibraryAccess}
          hasPlaybookAccess={hasPlaybookAccess}
          hasMemberDownloadsAccess={hasMemberDownloadsAccess}
          hasProgramEnrollment={hasProgramEnrollment}
          orgTrialHeader={orgTrialHeader}
          userDisplayName={userDisplayName}
          userEmail={session?.user?.email}
          isAdmin={hasAdminAccess}
          header={
            session?.user ? (
              <LoggedInSiteHeader
                membershipTier={membershipTier}
                userDisplayName={userDisplayName}
                userEmail={session.user.email}
                isAdmin={hasAdminAccess}
                hasDrillLibraryAccess={hasDrillLibraryAccess}
                hasPlaybookAccess={hasPlaybookAccess}
                hasMemberDownloadsAccess={hasMemberDownloadsAccess}
                hasCoachingAccess={hasCoachingAccess}
                hasProgramEnrollment={hasProgramEnrollment}
                orgTrialHeader={orgTrialHeader}
              />
            ) : null
          }
          adminToggle={null}
          footer={
            <footer className="border-t border-[#18243a] py-6 text-center text-sm text-zinc-400">
              <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-2 px-4 sm:px-6 md:flex-row md:gap-4">
                <span>
                  &copy; {new Date().getFullYear()} LCB Training LLC. All rights reserved.
                </span>
                <span className="hidden text-zinc-600 md:inline">|</span>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <a
                    href="https://www.instagram.com/lcbtraining"
                    className="transition hover:text-[#98b144]"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Instagram
                  </a>
                  <a
                    href="https://www.tiktok.com/@cbroc05"
                    className="transition hover:text-[#98b144]"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    TikTok
                  </a>
                  <Link href="/terms" className="transition hover:text-[#98b144]">
                    Terms of Service
                  </Link>
                  <Link href="/privacy" className="transition hover:text-[#98b144]">
                    Privacy Policy
                  </Link>
                  <Link href="/waiver" className="transition hover:text-[#98b144]">
                    Waiver
                  </Link>
                </div>
              </div>
            </footer>
          }
        >
          {children}
        </SiteShell>
        {session?.user ? <LegalAgreementGate /> : null}
        {session?.user ? <Under13ParentConsentGate /> : null}
        <PWAInstallHint />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
