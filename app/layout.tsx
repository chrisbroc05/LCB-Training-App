import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasDatabaseTierAccess, type DatabaseTier } from "@/lib/membership";
import { isAdminEmail } from "@/lib/admin";
import BrandLogo from "@/app/BrandLogo";
import TopNavigation from "@/app/TopNavigation";
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
  const membershipTier = (session?.user?.membershipTier ?? "FREE") as DatabaseTier;
  const hasBasicAccess = hasDatabaseTierAccess(membershipTier, "basic");
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
        <header className="sticky top-0 z-20 border-b border-[#18243a] bg-black/95 backdrop-blur">
          <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center justify-between gap-3 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 md:justify-self-start">
              <div className="relative h-10 w-28 sm:h-12 sm:w-32">
                <BrandLogo className="object-contain" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-zinc-100 sm:text-xl">
                LCB <span className="text-[#22c55e]">Training</span>
              </span>
            </Link>
            <p className="hidden text-sm italic font-light tracking-wide text-[#2D6A4F] md:block md:justify-self-center">
              Work Hard. Be Memorable.
            </p>
            <TopNavigation
              isLoggedIn={Boolean(session?.user)}
              isAdmin={hasAdminAccess}
              hasBasicAccess={hasBasicAccess}
              userDisplayName={userDisplayName}
            />
            </div>
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
