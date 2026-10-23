import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Host patterns that indicate a hosted production-style Postgres (never write tests here). */
const PRODUCTION_DATABASE_HOST_PATTERNS = [
  /\.render\.com/i,
  /\.rds\.amazonaws\.com/i,
  /\.supabase\.co/i,
  /\.neon\.tech/i,
];

export function loadDatabaseUrlFromEnvFile() {
  if (process.env.DATABASE_URL) {
    return;
  }
  try {
    const envPath = resolve(process.cwd(), ".env");
    const text = readFileSync(envPath, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const match = trimmed.match(/^DATABASE_URL=(.*)$/);
      if (match) {
        process.env.DATABASE_URL = match[1].replace(/^["']|["']$/g, "");
        break;
      }
    }
  } catch {
    /* no local .env */
  }
}

export function isLikelyProductionDatabaseUrl(databaseUrl: string): boolean {
  const normalized = databaseUrl.trim();
  if (!normalized) {
    return false;
  }
  return PRODUCTION_DATABASE_HOST_PATTERNS.some((pattern) => pattern.test(normalized));
}

export type TestDatabaseIntegrationDecision = {
  run: boolean;
  databaseUrl: string | null;
  warning: string | null;
};

/**
 * Decide whether a script may open a Prisma client for read/write integration tests.
 * When DATABASE_URL looks like production, DB tests run only if TEST_DATABASE_URL is set
 * and does not look like production.
 */
export function resolveTestDatabaseIntegration(): TestDatabaseIntegrationDecision {
  loadDatabaseUrlFromEnvFile();

  const configuredUrl = process.env.DATABASE_URL?.trim() ?? "";
  const testUrl = process.env.TEST_DATABASE_URL?.trim() ?? "";

  if (testUrl && isLikelyProductionDatabaseUrl(testUrl)) {
    return {
      run: false,
      databaseUrl: null,
      warning:
        "WARNING: TEST_DATABASE_URL looks like a production database. Refusing to run DB integration tests.",
    };
  }

  if (configuredUrl && isLikelyProductionDatabaseUrl(configuredUrl)) {
    if (!testUrl) {
      return {
        run: false,
        databaseUrl: null,
        warning:
          "WARNING: DATABASE_URL points at a production database (e.g. Render). Skipping DB integration tests. Set TEST_DATABASE_URL to a non-production database to run them.",
      };
    }
    return { run: true, databaseUrl: testUrl, warning: null };
  }

  const databaseUrl = testUrl || configuredUrl;
  if (!databaseUrl) {
    return {
      run: false,
      databaseUrl: null,
      warning: null,
    };
  }

  return { run: true, databaseUrl, warning: null };
}

/** Call before dynamic `import("../lib/prisma")` in test scripts. */
export function applyTestDatabaseUrl(databaseUrl: string) {
  process.env.DATABASE_URL = databaseUrl;
}
