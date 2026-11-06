import { NextResponse } from "next/server";
import { resolveCronDryRunNow } from "@/lib/cron-dry-run-at-shared";
import { runProgramEmailScheduler } from "@/lib/program-email-scheduler";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  return authHeader.slice("Bearer ".length) === secret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "1";

  try {
    let now: Date;
    let atQueryApplied: boolean;
    try {
      ({ now, atQueryApplied } = resolveCronDryRunNow({
        dryRun,
        atParam: dryRun ? url.searchParams.get("at") : null,
      }));
    } catch (parseError) {
      return NextResponse.json(
        { error: parseError instanceof Error ? parseError.message : "Invalid at parameter." },
        { status: 400 },
      );
    }

    const result = await runProgramEmailScheduler({
      dryRun,
      now,
      atQueryApplied: dryRun && atQueryApplied,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Program email cron failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Program email cron failed." },
      { status: 500 },
    );
  }
}
