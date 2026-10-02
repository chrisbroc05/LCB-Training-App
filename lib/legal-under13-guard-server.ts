import "server-only";

import { NextResponse } from "next/server";
import { userNeedsUnder13ParentLock } from "@/lib/legal-server";

export async function requireUnder13ParentUnlockResponse(userId: string | undefined | null) {
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const locked = await userNeedsUnder13ParentLock(userId);
  if (locked) {
    return NextResponse.json(
      {
        error: "A parent must confirm your agreement before you can do that.",
        code: "UNDER13_PARENT_LOCK",
      },
      { status: 403 },
    );
  }

  return null;
}
