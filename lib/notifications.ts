import nodemailer from "nodemailer";
import type { DatabaseTier } from "@/lib/membership";

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

function getNotificationRecipient() {
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  if (!notificationEmail) {
    throw new Error("NOTIFICATION_EMAIL is required for notifications.");
  }

  return notificationEmail;
}

export async function sendNewMemberNotification(params: {
  userEmail: string;
  membershipTier: DatabaseTier;
}) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: getNotificationRecipient(),
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
    to: getNotificationRecipient(),
    subject: "New Swing Submission",
    text: `A user submitted a new swing analysis video.\n\nEmail: ${params.userEmail}\nSubmitted Video: ${params.submittedVideo}`,
  });
}

export async function sendMentalGameSubmissionNotification(params: {
  userEmail: string;
  playerName: string;
  playerAge: string;
  topic: string;
  message: string;
  videoPath: string | null;
  responsePreference: string;
  status: string;
}) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: getNotificationRecipient(),
    subject: "New Mental Game Submission",
    text: `A user submitted a new mental game request.\n\nSubmitting User Email: ${params.userEmail}\nPlayer Name: ${params.playerName}\nPlayer Age: ${params.playerAge}\nTopic: ${params.topic}\nMessage: ${params.message}\nVideo: ${params.videoPath ?? "No video uploaded"}\nResponse Preference: ${params.responsePreference}\nStatus: ${params.status}`,
  });
}

export async function sendSubmissionResponseEmail(params: {
  toEmail: string;
  playerName: string;
  submissionType: "SWING_ANALYSIS" | "MENTAL_GAME";
  responseMode: "VIDEO" | "WRITTEN";
  writtenResponse?: string;
  videoResponseUrl?: string;
}) {
  const transporter = createTransporter();
  const submissionLabel =
    params.submissionType === "SWING_ANALYSIS" ? "swing analysis" : "mental game support";

  const responseBody =
    params.responseMode === "VIDEO"
      ? `Your coach has sent a video response: ${params.videoResponseUrl}`
      : `Your coach has sent a written response:\n\n${params.writtenResponse}`;

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: params.toEmail,
    subject: "Your LCB Training Coach Response",
    text: `Hi ${params.playerName},\n\nThanks for your ${submissionLabel} submission.\n\n${responseBody}\n\n-LCB Training`,
  });
}
