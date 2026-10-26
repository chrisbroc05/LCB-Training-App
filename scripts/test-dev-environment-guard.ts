import assert from "node:assert/strict";
import {
  isLiveStripeSecretKey,
  isProductionDatabaseUrl,
  isProductionR2BucketName,
} from "../lib/dev-environment-guard-shared";

assert.equal(
  isProductionDatabaseUrl(
    "postgresql://user:pass@dpg-xxx.oregon-postgres.render.com/lcb_training_database",
  ),
  true,
);
assert.equal(
  isProductionDatabaseUrl(
    "postgresql://neondb_owner:pass@ep-dark-tooth.pooler.neon.tech/neondb?sslmode=require",
  ),
  false,
);
assert.equal(isLiveStripeSecretKey("sk_live_abc"), true);
assert.equal(isLiveStripeSecretKey("sk_test_abc"), false);
assert.equal(isProductionR2BucketName("lcb-training-submissions"), true);
assert.equal(isProductionR2BucketName("lcb-training-app-dev"), false);

console.log("dev-environment-guard ok");
