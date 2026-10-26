import "server-only";

import nodemailer from "nodemailer";
import type { SendMailOptions } from "nodemailer";
import {
  recordDevOutboxEmail,
  shouldCaptureOutboundInDev,
} from "@/lib/dev-outbox-server";

function createProductionTransporter() {
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!notificationEmail || !emailPassword) {
    throw new Error("NOTIFICATION_EMAIL and EMAIL_PASSWORD are required for notifications.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: notificationEmail,
      pass: emailPassword,
    },
  });
}

/** Sends mail or captures to the dev outbox when NODE_ENV is development. */
export async function sendNotificationEmail(options: SendMailOptions) {
  if (shouldCaptureOutboundInDev()) {
    recordDevOutboxEmail({
      to: options.to,
      subject: options.subject,
      text: typeof options.text === "string" ? options.text : undefined,
      html: typeof options.html === "string" ? options.html : undefined,
    });
    console.log("[dev outbox email]", normalizeLogRecipient(options.to), options.subject ?? "");
    return { messageId: "dev-outbox" };
  }

  const transporter = createProductionTransporter();
  return transporter.sendMail(options);
}

function normalizeLogRecipient(to: SendMailOptions["to"]) {
  if (Array.isArray(to)) {
    return to.map(String).join(", ");
  }
  return String(to ?? "");
}
