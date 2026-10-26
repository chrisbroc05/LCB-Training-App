import { spawn, type ChildProcess } from "node:child_process";
import { assertSafeLocalDevelopmentEnvironment } from "../lib/dev-environment-guard-shared";

const LOCAL_PORT = process.env.PORT?.trim() || "3000";
const LOCAL_ORIGIN = `http://127.0.0.1:${LOCAL_PORT}`;
const TUNNEL_URL_PATTERN = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function killProcess(proc: ChildProcess | null) {
  if (!proc || proc.killed) {
    return;
  }
  proc.kill("SIGTERM");
}

async function waitForNextReady(proc: ChildProcess, timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timed out waiting for Next.js dev server to start."));
    }, timeoutMs);

    const onData = (chunk: Buffer) => {
      const text = chunk.toString();
      process.stdout.write(text);
      if (/Ready in|started server on|Local:/i.test(text)) {
        clearTimeout(timer);
        proc.stdout?.off("data", onData);
        resolve();
      }
    };

    proc.stdout?.on("data", onData);
    proc.stderr?.on("data", (chunk) => {
      process.stderr.write(chunk);
    });
  });
}

async function waitForTunnelUrl(proc: ChildProcess, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          "Timed out waiting for cloudflared tunnel URL. Install cloudflared (brew install cloudflared) and try again.",
        ),
      );
    }, timeoutMs);

    const onData = (chunk: Buffer) => {
      const text = chunk.toString();
      process.stderr.write(text);
      const match = text.match(TUNNEL_URL_PATTERN);
      if (match) {
        clearTimeout(timer);
        proc.stdout?.off("data", onData);
        proc.stderr?.off("data", onData);
        resolve(match[0]);
      }
    };

    proc.stdout?.on("data", onData);
    proc.stderr?.on("data", onData);
  });
}

function startNext(extraEnv: Record<string, string>) {
  return spawn("npx", ["next", "dev", "--webpack", "-p", LOCAL_PORT], {
    env: { ...process.env, ...extraEnv },
    stdio: ["inherit", "pipe", "pipe"],
  });
}

function startCloudflared() {
  return spawn("cloudflared", ["tunnel", "--url", LOCAL_ORIGIN], {
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function main() {
  assertSafeLocalDevelopmentEnvironment();

  const baseDevEnv = {
    NODE_ENV: "development",
    AUTH_TRUST_HOST: "true",
  };

  console.log("Starting Next.js on", LOCAL_ORIGIN, "...");
  let nextProc = startNext(baseDevEnv);
  await waitForNextReady(nextProc, 120_000);

  console.log("Starting Cloudflare quick tunnel (cloudflared)...");
  const tunnelProc = startCloudflared();
  const tunnelUrl = await waitForTunnelUrl(tunnelProc, 90_000);

  console.log("");
  console.log("=================================================================");
  console.log("Phone testing URL (open on your iPhone):");
  console.log(tunnelUrl);
  console.log("");
  console.log("Restarting Next.js with NEXTAUTH_URL and NEXT_PUBLIC_APP_URL set to the tunnel.");
  console.log("Dev guards and /dev/outbox still apply. Press Ctrl+C to stop.");
  console.log("=================================================================");
  console.log("");

  killProcess(nextProc);
  await sleep(800);

  nextProc = startNext({
    ...baseDevEnv,
    NEXTAUTH_URL: tunnelUrl,
    NEXT_PUBLIC_APP_URL: tunnelUrl,
  });
  nextProc.stdout?.on("data", (chunk) => process.stdout.write(chunk));
  nextProc.stderr?.on("data", (chunk) => process.stderr.write(chunk));

  const shutdown = () => {
    killProcess(nextProc);
    killProcess(tunnelProc);
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await new Promise<void>((resolve) => {
    nextProc.on("exit", () => resolve());
    tunnelProc.on("exit", () => resolve());
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
