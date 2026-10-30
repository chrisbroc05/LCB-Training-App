import { config } from "dotenv";

config();

import { previewLegacyLeadInviteCampaign } from "../lib/admin-lead-legacy-invite-server";

async function main() {
  const preview = await previewLegacyLeadInviteCampaign();
  console.log(
    JSON.stringify(
      {
        eligibleCount: preview.eligibleCount,
        alreadySentCount: preview.alreadySentCount,
        marketingStartAt: preview.marketingStartAt,
        note: "Counts all matching leads in DATABASE_URL (typically local dev). Not production.",
      },
      null,
      2,
    ),
  );
}

void main();
