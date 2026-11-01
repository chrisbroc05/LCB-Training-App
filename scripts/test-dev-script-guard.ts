import assert from "node:assert/strict";
import { assertDevOnlyScript } from "../lib/dev-script-guard-shared";

const env = process.env as Record<string, string | undefined>;
const originalEnv = env.NODE_ENV;
const originalDb = env.DATABASE_URL;

try {
  env.NODE_ENV = "production";
  env.DATABASE_URL = "postgresql://user:pass@localhost/neondb";
  assert.throws(
    () => assertDevOnlyScript("test"),
    /refused when NODE_ENV is production/,
  );
} finally {
  env.NODE_ENV = originalEnv;
  env.DATABASE_URL = originalDb;
}

console.log("test-dev-script-guard: ok");
