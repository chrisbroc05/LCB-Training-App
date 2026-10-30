import { config } from "dotenv";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";

config();

import {
  buildFollowupDrillsDay2Email,
  buildFollowupKnownForDay10Email,
  buildFollowupOtherSixDay4Email,
  buildFollowupSampleDayDay7Email,
  buildFreeSubmissionReminderEmail,
  buildMarketingTestSubmissionContext,
  buildWelcomeMarketingEmail,
} from "../lib/marketing-email-templates";
import {
  buildLegacyLeadFreeAccountInviteEmailContent,
  buildLeadDay3FreeAccountInviteEmailContent,
} from "../lib/lead-free-account-invite-email-shared";

const recipient = {
  userId: "copy-sample-user",
  email: "member@example.com",
  firstName: "Jordan",
  ownsPlaybook: false,
};

const playbookRecipient = {
  ...recipient,
  userId: "copy-playbook-user",
  ownsPlaybook: true,
  playbookBreakdownsRemaining: 2,
};

const outDir = path.join(process.cwd(), "dev/outbox/marketing-email-copy");

function writeCopy(filename: string, content: { subject: string; text: string }) {
  const body = `SUBJECT: ${content.subject}\n\n--- TEXT (as sent) ---\n\n${content.text}\n`;
  writeFileSync(path.join(outDir, filename), body, "utf8");
}

function main() {
  mkdirSync(outDir, { recursive: true });

  const submission = buildMarketingTestSubmissionContext();
  const signupUrl = "https://lcbtraining.com/auth?redirect=%2Fswing-analysis";

  const copies: Array<[string, { subject: string; text: string }]> = [
    ["WELCOME.txt", buildWelcomeMarketingEmail(recipient)],
    ["FREE_SUBMISSION_REMINDER.txt", buildFreeSubmissionReminderEmail(recipient)],
    ["FOLLOWUP_DRILLS_DAY_2.txt", buildFollowupDrillsDay2Email(recipient, submission)],
    ["FOLLOWUP_OTHER_SIX_DAY_4.txt", buildFollowupOtherSixDay4Email(recipient)],
    ["FOLLOWUP_SAMPLE_DAY_DAY_7.txt", buildFollowupSampleDayDay7Email(recipient)],
    ["FOLLOWUP_KNOWN_FOR_DAY_10.txt", buildFollowupKnownForDay10Email(recipient)],
    [
      "FOLLOWUP_KNOWN_FOR_DAY_10_PLAYBOOK_OWNER.txt",
      buildFollowupKnownForDay10Email(playbookRecipient),
    ],
    [
      "LEAD_DAY_3_INVITE.txt",
      buildLeadDay3FreeAccountInviteEmailContent({
        firstName: "Jordan",
        leadId: "sample-lead-id",
        resourceTitle: "The Player IQ Quiz",
        signupUrl,
      }),
    ],
    [
      "LEAD_DAY_3_INVITE_UNKNOWN_RESOURCE.txt",
      buildLeadDay3FreeAccountInviteEmailContent({
        firstName: "Jordan",
        leadId: "sample-lead-id",
        resourceTitle: null,
        signupUrl,
      }),
    ],
    [
      "LEGACY_LEAD_INVITE.txt",
      buildLegacyLeadFreeAccountInviteEmailContent({
        firstName: "Jordan",
        leadId: "sample-lead-id",
        signupUrl,
      }),
    ],
  ];

  for (const [filename, content] of copies) {
    writeCopy(filename, content);
    console.log(`Wrote ${path.join(outDir, filename)}`);
  }
}

main();
