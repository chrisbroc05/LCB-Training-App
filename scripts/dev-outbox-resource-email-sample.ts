/**
 * Captures a free-resource delivery email in the dev outbox (NODE_ENV=development).
 * Run: NODE_ENV=development NEXTAUTH_URL=http://localhost:3000 npx tsx scripts/dev-outbox-resource-email-sample.ts
 */
import { sendResourceDeliveryEmail } from "../lib/resource-emails-server";
import { getResourceDefinition } from "../lib/resources-shared";

async function main() {
  const resourceSlug = "starter-warmup";
  const resource = getResourceDefinition(resourceSlug);
  if (!resource?.downloadFileKeys?.length) {
    throw new Error(`Missing resource definition for ${resourceSlug}`);
  }

  await sendResourceDeliveryEmail({
    toEmail: "lead-sample@dev.lcbtraining.test",
    firstName: "Sample",
    resourceSlug,
    leadId: "dev-outbox-lead-sample",
  });

  console.log("Captured free resource delivery email in dev outbox.");
  console.log("Open http://localhost:3000/dev/outbox and confirm links use /resources/download/go?token=");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
