import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/password-reset-server";
import { PASSWORD_UPDATED_MESSAGE } from "@/lib/password-shared";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { token?: string; password?: string; confirmPassword?: string };
  try {
    body = (await request.json()) as {
      token?: string;
      password?: string;
      confirmPassword?: string;
    };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = await resetPasswordWithToken({
    token: body.token ?? "",
    password: body.password ?? "",
    confirmPassword: body.confirmPassword ?? "",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: PASSWORD_UPDATED_MESSAGE,
    email: result.email,
  });
}
