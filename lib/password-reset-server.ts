import "server-only";

import { createHash, randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email-delivery-server";
import {
  buildEmailButton,
  buildMemberEmailHtml,
  EMAIL_REPLY_TO,
  escapeHtml,
  getPublicAppUrl,
} from "@/lib/email-layout";
import {
  PASSWORD_RESET_GENERIC_MESSAGE,
  validatePasswordConfirmation,
} from "@/lib/password-shared";

export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
export const PASSWORD_RESET_RATE_LIMIT = 5;
export const PASSWORD_RESET_RATE_WINDOW_MS = 60 * 60 * 1000;

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function emailAttemptKey(email: string) {
  return `email:${email.trim().toLowerCase()}`;
}

function ipAttemptKey(ip: string) {
  return `ip:${ip.trim() || "unknown"}`;
}

async function isRateLimited(key: string) {
  const since = new Date(Date.now() - PASSWORD_RESET_RATE_WINDOW_MS);
  const count = await prisma.passwordResetAttempt.count({
    where: { key, createdAt: { gte: since } },
  });
  return count >= PASSWORD_RESET_RATE_LIMIT;
}

async function recordAttempt(key: string) {
  await prisma.passwordResetAttempt.create({ data: { key } });
}

function buildResetEmail(params: { resetUrl: string; firstName: string | null }) {
  const greeting = params.firstName?.trim()
    ? `Hi ${escapeHtml(params.firstName.trim())},`
    : "Hi,";
  const subject = "Reset your LCB Training password";
  const bodyContentHtml = `<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${greeting}</p>
      <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">We received a request to reset your LCB Training password. This link expires in 60 minutes and can only be used once.</p>
      ${buildEmailButton("Reset your password", params.resetUrl)}
      <p style="margin:20px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.6; color:#6B7280;">If you did not request this, you can ignore this email.</p>`;
  const text = `${params.firstName?.trim() ? `Hi ${params.firstName.trim()},` : "Hi,"}

We received a request to reset your LCB Training password. This link expires in 60 minutes and can only be used once.

Reset your password: ${params.resetUrl}

If you did not request this, you can ignore this email.`;

  return {
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml }),
    text,
  };
}

function buildPasswordChangedEmail(params: { firstName: string | null }) {
  const greeting = params.firstName?.trim()
    ? `Hi ${escapeHtml(params.firstName.trim())},`
    : "Hi,";
  const subject = "Your LCB Training password was changed";
  const bodyContentHtml = `<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${greeting}</p>
      <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">Your LCB Training password was just updated. If this was you, no further action is needed.</p>
      <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">If you did not change your password, reply to this email right away.</p>`;
  const text = `${params.firstName?.trim() ? `Hi ${params.firstName.trim()},` : "Hi,"}

Your LCB Training password was just updated. If this was you, no further action is needed.

If you did not change your password, reply to this email right away.`;

  return {
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml }),
    text,
  };
}

/**
 * Always returns the same generic message. Account email is used as-is
 * (for under-13 accounts that is the parent email on the account).
 */
export async function requestPasswordReset(params: {
  email: string;
  ip: string;
}) {
  const email = params.email.trim().toLowerCase();
  const emailKey = emailAttemptKey(email);
  const ipKey = ipAttemptKey(params.ip);

  const [emailLimited, ipLimited] = await Promise.all([
    isRateLimited(emailKey),
    isRateLimited(ipKey),
  ]);

  await Promise.all([recordAttempt(emailKey), recordAttempt(ipKey)]);

  if (!email || emailLimited || ipLimited) {
    return { ok: true as const, message: PASSWORD_RESET_GENERIC_MESSAGE };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      playerFirstName: true,
      name: true,
    },
  });

  if (!user) {
    return { ok: true as const, message: PASSWORD_RESET_GENERIC_MESSAGE };
  }

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  const resetUrl = `${getPublicAppUrl()}/auth/reset-password?token=${encodeURIComponent(rawToken)}`;
  const fromEmail = process.env.NOTIFICATION_EMAIL?.trim();
  if (!fromEmail) {
    throw new Error("NOTIFICATION_EMAIL is required to send password reset emails.");
  }

  const firstName = user.playerFirstName?.trim() || user.name?.trim().split(/\s+/)[0] || null;
  const mail = buildResetEmail({ resetUrl, firstName });
  await sendNotificationEmail({
    from: `"LCB Training" <${fromEmail}>`,
    to: user.email,
    replyTo: EMAIL_REPLY_TO,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });

  return { ok: true as const, message: PASSWORD_RESET_GENERIC_MESSAGE };
}

export async function resetPasswordWithToken(params: {
  token: string;
  password: string;
  confirmPassword: string;
}) {
  const validationError = validatePasswordConfirmation(
    params.password,
    params.confirmPassword,
  );
  if (validationError) {
    return { ok: false as const, error: validationError };
  }

  const token = params.token.trim();
  if (!token) {
    return { ok: false as const, error: "This reset link is invalid or has expired." };
  }

  const tokenHash = hashResetToken(token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          playerFirstName: true,
          name: true,
        },
      },
    },
  });

  if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
    return { ok: false as const, error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await hash(params.password, 12);
  const now = new Date();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: {
        password: passwordHash,
        passwordChangedAt: now,
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: now },
    }),
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null, id: { not: record.id } },
      data: { usedAt: now },
    }),
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);

  const fromEmail = process.env.NOTIFICATION_EMAIL?.trim();
  if (fromEmail) {
    const firstName =
      record.user.playerFirstName?.trim() ||
      record.user.name?.trim().split(/\s+/)[0] ||
      null;
    const mail = buildPasswordChangedEmail({ firstName });
    await sendNotificationEmail({
      from: `"LCB Training" <${fromEmail}>`,
      to: record.user.email,
      replyTo: EMAIL_REPLY_TO,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
  }

  return {
    ok: true as const,
    email: record.user.email,
  };
}
