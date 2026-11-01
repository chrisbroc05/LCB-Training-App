import "server-only";

import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Reads session on a per-request basis (never from a static join-page cache). */
export async function getRequestServerSession() {
  cookies();
  return getServerSession(authOptions);
}
