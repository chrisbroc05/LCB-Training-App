import { config } from "dotenv";

config();

import { buildEmailFooterText } from "../lib/email-layout";
import { buildWelcomeMarketingEmail } from "../lib/marketing-email-templates";

function main() {
  const footer = buildEmailFooterText();
  if (!footer.includes("PO Box 246")) {
    console.error("COMPANY_MAILING_ADDRESS missing from footer:", footer.slice(-200));
    process.exit(1);
  }

  const welcome = buildWelcomeMarketingEmail({
    userId: "test-user",
    email: "footer-test@dev.local",
    firstName: "Test",
    ownsPlaybook: false,
  });
  if (!welcome.text.includes("PO Box 246")) {
    console.error("Welcome marketing text missing PO Box");
    process.exit(1);
  }
  if (!welcome.text.includes("Unsubscribe from marketing emails")) {
    console.error("Welcome marketing text missing unsubscribe");
    process.exit(1);
  }

  console.log("test-marketing-footer-dev: ok");
  console.log("subject:", welcome.subject);
}

main();
