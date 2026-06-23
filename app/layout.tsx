import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasDatabaseTierAccess, type DatabaseTier } from "@/lib/membership";
import UserAuthStatus from "@/app/UserAuthStatus";
import { isAdminEmail } from "@/lib/admin";
import BrandLogo from "@/app/BrandLogo";
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
  const membershipTier = (session?.user?.membershipTier ?? "FREE") as DatabaseTier;
  const hasBasicAccess = hasDatabaseTierAccess(membershipTier, "basic");
  const hasAdminAccess = isAdminEmail(session?.user?.email);
  const userDisplayName = session?.user?.name || session?.user?.email || "Member";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-zinc-100">
        <header className="sticky top-0 z-20 border-b border-[#18243a] bg-black/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <div className="relative h-10 w-28 sm:h-12 sm:w-32">
                <BrandLogo className="object-contain" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-zinc-100 sm:text-xl">
                LCB <span className="text-[#22c55e]">Training</span>
              </span>
            </Link>
            <nav className="flex w-full flex-wrap items-center gap-2 text-[11px] text-zinc-200 sm:w-auto sm:justify-end sm:gap-4 sm:text-sm">
              <Link href="/dashboard" className="rounded-full px-2 py-1 transition hover:text-[#7f9434] sm:px-0 sm:py-0">
                Dashboard
              </Link>
              {session?.user && (
                <Link href="/settings" className="rounded-full px-2 py-1 transition hover:text-[#7f9434] sm:px-0 sm:py-0">
                  Settings
                </Link>
              )}
              {hasBasicAccess && (
                <Link href="/workouts" className="rounded-full px-2 py-1 transition hover:text-[#7f9434] sm:px-0 sm:py-0">
                  Workouts
                </Link>
              )}
              <Link
                href="/swing-analysis"
                className="rounded-full border border-[#22c55e]/70 bg-[#22c55e]/10 px-2.5 py-1.5 font-medium text-[#8df0b1] transition hover:bg-[#22c55e]/20 sm:px-4 sm:py-2"
              >
                Submit Swing
              </Link>
              {session?.user && (
                <Link
                  href="/mental-game"
                  className="rounded-full border border-[#22c55e]/70 bg-[#22c55e]/10 px-2.5 py-1.5 font-medium text-[#8df0b1] transition hover:bg-[#22c55e]/20 sm:px-4 sm:py-2"
                >
                  Mental Support
                </Link>
              )}
              {hasAdminAccess && (
                <Link
                  href="/admin"
                  className="rounded-full border border-yellow-500/60 bg-yellow-500/10 px-2.5 py-1.5 font-medium text-yellow-200 transition hover:bg-yellow-500/20 sm:px-4 sm:py-2"
                >
                  Admin
                </Link>
              )}
              <UserAuthStatus
                isLoggedIn={Boolean(session?.user)}
                displayName={userDisplayName}
                membershipTier={membershipTier}
              />
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[#18243a] py-6 text-center text-sm text-zinc-400">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-2 px-4 sm:px-6 md:flex-row md:gap-4">
            <span>© {new Date().getFullYear()} LCB Training. All rights reserved.</span>
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
      </body>
    </html>
  );
}
