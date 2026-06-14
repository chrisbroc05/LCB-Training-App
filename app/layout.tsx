import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasDatabaseTierAccess, type DatabaseTier } from "@/lib/membership";
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
  const membershipTier = (session?.user?.membershipTier ?? "BASIC") as DatabaseTier;
  const hasProAccess = hasDatabaseTierAccess(membershipTier, "pro");

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-zinc-100">
        <header className="sticky top-0 z-20 border-b border-[#18243a] bg-black/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-32 items-center justify-center rounded-md border border-dashed border-[#3b4b6a] bg-[#0f1d34] text-[11px] font-medium uppercase tracking-wide text-zinc-300">
                LCB Training Logo
              </div>
              <span className="text-xl font-semibold tracking-tight text-zinc-100">
                LCB <span className="text-[#22c55e]">Training</span>
              </span>
            </Link>
            <nav className="flex items-center gap-5 text-sm text-zinc-200">
              <Link href="/auth" className="transition hover:text-[#7f9434]">
                Login / Signup
              </Link>
              <Link href="/dashboard" className="transition hover:text-[#7f9434]">
                Dashboard
              </Link>
              <Link
                href="/swing-analysis"
                className="rounded-full border border-[#22c55e]/70 bg-[#22c55e]/10 px-4 py-2 font-medium text-[#8df0b1] transition hover:bg-[#22c55e]/20"
              >
                Submit Swing
              </Link>
              {hasProAccess && (
                <Link
                  href="/mental-game"
                  className="rounded-full border border-[#22c55e]/70 bg-[#22c55e]/10 px-4 py-2 font-medium text-[#8df0b1] transition hover:bg-[#22c55e]/20"
                >
                  Mental Support
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[#18243a] py-6 text-center text-sm text-zinc-400">
          © {new Date().getFullYear()} LCB Training. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
