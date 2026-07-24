import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  canAccessCoachingNav,
  hasDatabaseTierAccess,
  type DatabaseTier,
} from "@/lib/membership";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import BrandLogo from "@/app/BrandLogo";
import TopNavigation from "@/app/TopNavigation";
import AdminViewToggle from "@/app/AdminViewToggle";
import SiteShell from "@/app/SiteShell";
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
  title: "LCB Training",
  description: "Baseball membership training platform by LCB Training",
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
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { membershipTier: true },
    });
    membershipTier = (user?.membershipTier ?? "FREE") as DatabaseTier;
  }

  const hasBasicAccess = hasDatabaseTierAccess(membershipTier, "basic");
  const hasCoachingAccess = canAccessCoachingNav(membershipTier);
  const hasAdminAccess = isAdminEmail(session?.user?.email);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
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
        <SiteShell
          header={
            <header className="sticky top-0 z-20 border-b border-[#18243a] bg-black/95 backdrop-blur">
              <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex items-center justify-between gap-3 md:grid md:grid-cols-[1fr_auto] md:items-center">
                  <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <div className="relative h-10 w-28 shrink-0 sm:h-12 sm:w-32">
                      <BrandLogo className="object-contain" />
                    </div>
                    <span className="shrink-0 text-lg font-semibold tracking-tight text-zinc-100 sm:text-xl">
                      LCB <span className="text-[#22c55e]">Training</span>
                    </span>
                  </Link>
                  <TopNavigation
                    isLoggedIn={Boolean(session?.user)}
                    isAdmin={hasAdminAccess}
                    hasBasicAccess={hasBasicAccess}
                    hasCoachingAccess={hasCoachingAccess}
                    userDisplayName={userDisplayName}
                  />
                </div>
              </div>
              <div className="hidden w-full bg-[#0A1628] py-2 md:block">
                <p className="text-center text-sm italic text-[#52B788]">Work Hard. Be Memorable.</p>
              </div>
            </header>
          }
          adminToggle={<AdminViewToggle isAdmin={hasAdminAccess} />}
          footer={
            <footer className="border-t border-[#18243a] py-6 text-center text-sm text-zinc-400">
              <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-2 px-4 sm:px-6 md:flex-row md:gap-4">
                <span>&copy; {new Date().getFullYear()} LCB Training. All rights reserved.</span>
                <span className="hidden text-zinc-600 md:inline">|</span>
                <div className="flex items-center gap-4">
                  <Link href="/terms" className="transition hover:text-[#98b144]">
                    Terms of Service
                  </Link>
                  <Link href="/privacy" className="transition hover:text-[#98b144]">
                    Privacy Policy
                  </Link>
                </div>
              </div>
            </footer>
          }
        >
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
