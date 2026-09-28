import { NextResponse } from "next/server";
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

  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";

  try {
    const result = await runProgramEmailScheduler({ dryRun });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Program email cron failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Program email cron failed." },
      { status: 500 },
    );
  }
}
