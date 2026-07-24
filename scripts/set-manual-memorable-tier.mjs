import { existsSync, readFileSync } from "node:fs";
import pg from "pg";

const TARGET_EMAIL = "f.matijevic@comcast.net";

function loadLocalEnv(path = ".env") {
  if (!existsSync(path)) {
    return;
  }

  for (const rawLine of readFileSync(path, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }

    const [key, ...rest] = line.split("=");
    const value = rest.join("=").trim().replace(/^["']|["']$/g, "");
    if (key.trim()) {
      process.env[key.trim()] ??= value;
    }
  }
}

async function main() {
  loadLocalEnv();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }

  const pool = new pg.Pool({
    connectionString,
    ssl: /localhost|127\.0\.0\.1/.test(connectionString)
      ? undefined
      : { rejectUnauthorized: false },
  });

  try {
    const before = await pool.query(
      `SELECT id, email, "membershipTier", "subscriptionStatus", "stripeCustomerId", "stripeSubscriptionId"
       FROM "User"
       WHERE LOWER(email) = LOWER($1)`,
      [TARGET_EMAIL],
    );

    if (before.rowCount !== 1) {
      throw new Error(
        `Expected exactly one user for ${TARGET_EMAIL}, found ${before.rowCount ?? 0}.`,
      );
    }

    console.log("Before update:", before.rows[0]);

    const after = await pool.query(
      `UPDATE "User"
       SET "membershipTier" = 'MEMORABLE',
           "subscriptionStatus" = 'NONE',
           "stripeCustomerId" = NULL,
           "stripeSubscriptionId" = NULL,
           "stripePriceId" = NULL,
           "subscriptionCurrentPeriodEnd" = NULL,
           "subscriptionCancelAtPeriodEnd" = false,
           "updatedAt" = NOW()
       WHERE LOWER(email) = LOWER($1)
       RETURNING id, email, "membershipTier", "subscriptionStatus", "stripeCustomerId", "stripeSubscriptionId"`,
      [TARGET_EMAIL],
    );

    console.log("After update:", after.rows[0]);
    console.log("Manual Memorable tier applied successfully.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
