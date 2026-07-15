import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      membershipTier: "FREE" | "BASIC" | "MEMORABLE" | "ELITE";
    } & DefaultSession["user"];
  }

  interface User {
    membershipTier?: "FREE" | "BASIC" | "MEMORABLE" | "ELITE";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    membershipTier?: "FREE" | "BASIC" | "MEMORABLE" | "ELITE";
  }
}
