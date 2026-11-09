import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DB_CHECK_TIMEOUT_MS = 3_000;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
} as const;

async function checkDatabase(): Promise<boolean> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("db_timeout"));
        }, DB_CHECK_TIMEOUT_MS);
      }),
    ]);
    return true;
  } catch {
    return false;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/** Lightweight uptime probe: no auth, no user data, no R2. */
export async function GET() {
  const dbOk = await checkDatabase();

  if (!dbOk) {
    return NextResponse.json(
      { ok: false, db: "error" },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  return NextResponse.json({ ok: true, db: "ok" }, { status: 200, headers: NO_STORE_HEADERS });
}
