import {
  canDownloadWorkoutPdfs,
  getWorkoutAccessMode,
  hasFullDrillLibraryAccess,
  resolveEffectiveLevel,
  type AccessUserFields,
} from "@/lib/access-shared";
import {
  getPlaybookLifetimeSubmissionLimit,
  hasPlaybookLegacyAccess,
} from "@/lib/playbook-entitlements-shared";
import { PLAYBOOK_NAME } from "@/lib/playbook-branding";

/** Dashboard / welcome copy for Playbook buyers (new vs legacy). */
export function buildPlaybookPurchaseWelcomeSummary(user: AccessUserFields): string {
  const pieces: string[] = [`${PLAYBOOK_NAME} chapters`];

  const effective = resolveEffectiveLevel(user);
  if (hasFullDrillLibraryAccess(user)) {
    pieces.push("the full drill library");
  } else if (
    getWorkoutAccessMode(user) === "starter_in_app" ||
    (effective === "PLAYBOOK" && user.membershipTier === "BASIC" && !hasPlaybookLegacyAccess(user))
  ) {
    pieces.push("starter drills in the app");
  }

  if (canDownloadWorkoutPdfs(user)) {
    pieces.push("workout PDF downloads");
  } else if (user.membershipTier === "BASIC" && !hasPlaybookLegacyAccess(user)) {
    pieces.push("four bonus guides");
  }

  const submissionLimit = getPlaybookLifetimeSubmissionLimit(user);
  if (submissionLimit != null) {
    const noun =
      submissionLimit === 1
        ? "1 lifetime coaching submission"
        : `${submissionLimit} lifetime coaching submissions`;
    pieces.push(noun);
  }

  if (pieces.length === 1) {
    return `Your ${pieces[0]} are ready whenever you are.`;
  }

  const last = pieces.pop()!;
  return `Your ${pieces.join(", ")}, and ${last} are ready whenever you are.`;
}
