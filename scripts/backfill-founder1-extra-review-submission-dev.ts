import { assertDevOnlyScript } from "../lib/dev-script-guard-shared";
import { prisma } from "../lib/prisma";

const FOUNDER1_EMAIL = "founder1@dev.lcbtraining.test";
const EXTRA_REVIEW_SUBMISSION_ID = "cmvyde2p90000ctogobx6tkj4";

async function main() {
  assertDevOnlyScript("scripts/backfill-founder1-extra-review-submission-dev.ts");
  const user = await prisma.user.findFirst({
    where: { email: FOUNDER1_EMAIL },
    select: { id: true, email: true },
  });
  if (!user) {
    throw new Error(`User not found: ${FOUNDER1_EMAIL}`);
  }

  const submission = await prisma.swingAnalysisSubmission.findFirst({
    where: { id: EXTRA_REVIEW_SUBMISSION_ID, userId: user.id },
    select: { id: true, reviewTrack: true, playerName: true, createdAt: true },
  });
  if (!submission) {
    throw new Error("Extra review swing submission not found for founder1.");
  }

  const updated =
    submission.reviewTrack === "EXTRA_REVIEW"
      ? submission
      : await prisma.swingAnalysisSubmission.update({
          where: { id: submission.id },
          data: { reviewTrack: "EXTRA_REVIEW" },
          select: { id: true, reviewTrack: true, playerName: true, createdAt: true },
        });

  const credit = await prisma.extraReviewCredit.findFirst({
    where: { userId: user.id },
    orderBy: { purchasedAt: "desc" },
    select: { id: true, usedAt: true },
  });

  console.log(
    JSON.stringify(
      {
        user: user.email,
        submission: updated,
        credit,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
