import { assertSafeDevDatabaseTarget } from "@/lib/dev-environment-guard-shared";

/** Refuse dev-only maintenance scripts in production or against production databases. */
export function assertDevOnlyScript(context: string) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${context}: refused when NODE_ENV is production.`);
  }

  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  if (databaseUrl) {
    assertSafeDevDatabaseTarget(databaseUrl, context);
  }
}
