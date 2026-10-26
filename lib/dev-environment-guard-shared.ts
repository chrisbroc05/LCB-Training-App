/** Client-safe production detection for local dev safety (no secrets). */

export const PRODUCTION_DATABASE_HOST_PATTERNS = [/\.render\.com/i, /\.rds\.amazonaws\.com/i];

/** Postgres database name segments that indicate Render/production data (not Neon dev `neondb`). */
export const PRODUCTION_DATABASE_NAME_PATTERNS = [/lcb_training/i];

export const PRODUCTION_R2_BUCKET_NAMES = new Set(["lcb-training-submissions"]);

export function isProductionDatabaseUrl(databaseUrl: string): boolean {
  const normalized = databaseUrl.trim();
  if (!normalized) {
    return false;
  }

  if (PRODUCTION_DATABASE_HOST_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  try {
    const parsed = new URL(normalized.replace(/^postgresql:/, "postgres:"));
    const path = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    const dbName = path.split("?")[0] ?? "";
    if (PRODUCTION_DATABASE_NAME_PATTERNS.some((pattern) => pattern.test(dbName))) {
      return true;
    }
  } catch {
    if (PRODUCTION_DATABASE_NAME_PATTERNS.some((pattern) => pattern.test(normalized))) {
      return true;
    }
  }

  return false;
}

export function isLiveStripeSecretKey(secretKey: string | undefined | null): boolean {
  const trimmed = secretKey?.trim() ?? "";
  return trimmed.startsWith("sk_live");
}

export function isProductionR2BucketName(bucketName: string | undefined | null): boolean {
  const trimmed = bucketName?.trim() ?? "";
  return PRODUCTION_R2_BUCKET_NAMES.has(trimmed);
}

export function assertSafeLocalDevelopmentEnvironment() {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  if (databaseUrl && isProductionDatabaseUrl(databaseUrl)) {
    throw new Error(
      "Refusing to start in development: DATABASE_URL looks like production (Render host or lcb_training database). Use your Neon dev database in .env instead.",
    );
  }

  if (isLiveStripeSecretKey(process.env.STRIPE_SECRET_KEY)) {
    throw new Error(
      "Refusing to start in development: STRIPE_SECRET_KEY is a live key (sk_live). Use Stripe test mode keys locally.",
    );
  }

  if (isProductionR2BucketName(process.env.CLOUDFLARE_R2_BUCKET_NAME)) {
    throw new Error(
      "Refusing to start in development: CLOUDFLARE_R2_BUCKET_NAME is the production submissions bucket. Use lcb-training-app-dev locally.",
    );
  }
}

export function assertSafeDevDatabaseTarget(databaseUrl: string, context: string) {
  if (isProductionDatabaseUrl(databaseUrl)) {
    throw new Error(
      `${context}: DATABASE_URL looks like production. Refusing to run against production data.`,
    );
  }
}
