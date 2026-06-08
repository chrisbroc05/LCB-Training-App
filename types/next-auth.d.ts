import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      membershipTier: "BASIC" | "PRO" | "ELITE";
    };
  }

  interface User {
    membershipTier?: "BASIC" | "PRO" | "ELITE";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    membershipTier?: "BASIC" | "PRO" | "ELITE";
  }
}
