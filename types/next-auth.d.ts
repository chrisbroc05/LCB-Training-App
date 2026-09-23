import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      membershipTier: "FREE" | "BASIC" | "TWELVE_WEEK" | "MEMORABLE" | "ELITE";
      pendingCheckoutTier: "BASIC" | "TWELVE_WEEK" | "MEMORABLE" | "ELITE" | null;
    } & DefaultSession["user"];
  }

  interface User {
    membershipTier?: "FREE" | "BASIC" | "TWELVE_WEEK" | "MEMORABLE" | "ELITE";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    membershipTier?: "FREE" | "BASIC" | "TWELVE_WEEK" | "MEMORABLE" | "ELITE";
    pendingCheckoutTier?: "BASIC" | "TWELVE_WEEK" | "MEMORABLE" | "ELITE" | null;
  }
}
