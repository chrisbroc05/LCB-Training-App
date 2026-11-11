import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/password-reset-server";
import { PASSWORD_RESET_GENERIC_MESSAGE } from "@/lib/password-shared";
import { getRequestIp } from "@/lib/waiver-sign-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ message: PASSWORD_RESET_GENERIC_MESSAGE });
  }

  const result = await requestPasswordReset({
    email: body.email ?? "",
    ip: getRequestIp(request),
  });

  return NextResponse.json({ message: result.message });
}
