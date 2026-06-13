import nodemailer from "nodemailer";
import type { DatabaseTier } from "@/lib/membership";

const notificationRecipient = "chrisbroc05@gmail.com";

function createTransporter() {
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

export async function sendNewMemberNotification(params: {
  userEmail: string;
  membershipTier: DatabaseTier;
}) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: notificationRecipient,
    subject: "New Member Signed Up",
    text: `A new member signed up.\n\nEmail: ${params.userEmail}\nMembership Tier: ${params.membershipTier}`,
  });
}

export async function sendSwingSubmissionNotification(params: {
  userEmail: string;
  submittedVideo: string;
}) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: notificationRecipient,
    subject: "New Swing Submission",
    text: `A user submitted a new swing analysis video.\n\nEmail: ${params.userEmail}\nSubmitted Video: ${params.submittedVideo}`,
  });
}
