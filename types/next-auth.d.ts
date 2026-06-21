import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      membershipTier: "FREE" | "BASIC" | "PRO" | "ELITE";
    };
  }

  interface User {
    membershipTier?: "FREE" | "BASIC" | "PRO" | "ELITE";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    membershipTier?: "FREE" | "BASIC" | "PRO" | "ELITE";
  }
}
