import "server-only";

import { NextResponse } from "next/server";
import { userHasCurrentTermsAcceptance } from "@/lib/legal-server";
import { requireUnder13ParentUnlockResponse } from "@/lib/legal-under13-guard-server";

export async function requireCurrentTermsForCheckout(userId: string | undefined | null) {
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const accepted = await userHasCurrentTermsAcceptance(userId);
  if (!accepted) {
    return NextResponse.json(
      {
        error:
          "Please accept the updated Terms of Service, Privacy Policy, and Waiver before checkout.",
        code: "TERMS_REQUIRED",
      },
      { status: 403 },
    );
  }

  const under13LockError = await requireUnder13ParentUnlockResponse(userId);
  if (under13LockError) {
    return under13LockError;
  }

  return null;
}
