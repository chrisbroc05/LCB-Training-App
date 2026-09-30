import {
  buildEmailButton,
  buildEmailInfoBox,
  buildEmailSectionLabel,
  buildMemberEmailHtml,
  buildEmailFooterText,
  escapeHtml,
  getPublicAppUrl,
} from "@/lib/email-layout";
import { formatTaskLineForEmail, getTaskCategoryLabel } from "@/lib/program-email-task-label";

export function getPlayerFirstName(name: string | null | undefined, email: string) {
  const source = (name ?? email).trim();
  const first = source.split(/\s+/)[0] ?? source;
  return first || "Player";
}

function buildKnownForBoxHtml(knownFor: string | null | undefined) {
  if (!knownFor?.trim()) {
    return "";
  }

  return buildEmailInfoBox(`<p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; font-weight:700; color:#6B7280;">What do you want to be known for?</p>
        <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; font-style:italic; color:#0A1628;">${escapeHtml(knownFor.trim())}</p>`);
}

function buildKnownForBoxText(knownFor: string | null | undefined) {
  if (!knownFor?.trim()) {
    return "";
  }

  return `\n\nWhat do you want to be known for?\n"${knownFor.trim()}"`;
}

function buildCoachWeekBoxHtml(params: { focus: string; note: string }) {
  return buildEmailInfoBox(`<p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#6B7280;">THIS WEEK FROM COACH BROC</p>
        <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:16px; font-weight:700; color:#0A1628;">${escapeHtml(params.focus)}</p>
        <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:#0A1628;">${escapeHtml(params.note)}</p>`);
}

function buildCoachWeekBoxText(params: { focus: string; note: string }) {
  return `\n\nTHIS WEEK FROM COACH BROC\n${params.focus}\n${params.note}`;
}

function buildTaskListHtml(
  tasks: Array<{ type: string; title: string; target: string; focus?: string }>,
) {
  return tasks
    .map((task) => {
      const category = getTaskCategoryLabel(task.type);
      const focusLine = task.focus
        ? `<p style="margin:4px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.5; color:#6B7280;">Focus: ${escapeHtml(task.focus)}</p>`
        : "";

      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 16px 0; border-collapse:collapse;">
        <tr>
          <td style="padding:0 0 4px 0;">
            <span style="display:inline-block; padding:2px 8px; border-radius:4px; background-color:#2D6A4F; font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:700; letter-spacing:0.06em; color:#FFFFFF;">${escapeHtml(category)}</span>
          </td>
        </tr>
        <tr>
          <td>
            <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; font-weight:700; color:#0A1628;">${escapeHtml(task.title)}</p>
            <p style="margin:4px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#0A1628;">${escapeHtml(task.target)}</p>
            ${focusLine}
          </td>
        </tr>
      </table>`;
    })
    .join("");
}

function buildTaskListText(
  tasks: Array<{ type: string; title: string; target: string; focus?: string }>,
) {
  return tasks.map((task) => `- ${formatTaskLineForEmail(task)}`).join("\n");
}

function buildPlayerSettingsFooterHtml() {
  const settingsUrl = `${getPublicAppUrl()}/settings#program-emails`;
  return `<p style="margin:24px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.6; color:#6B7280;"><a href="${escapeHtml(settingsUrl)}" style="color:#2D6A4F; text-decoration:underline;">Manage daily routine emails</a></p>`;
}

function buildPlayerSettingsFooterText() {
  return `\nManage daily routine emails: ${getPublicAppUrl()}/settings#program-emails`;
}

function buildParentUnsubscribeFooterHtml(unsubscribeUrl: string) {
  return `<p style="margin:24px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.6; color:#6B7280;"><a href="${escapeHtml(unsubscribeUrl)}" style="color:#2D6A4F; text-decoration:underline;">Turn off second email</a></p>`;
}

function buildParentUnsubscribeFooterText(unsubscribeUrl: string) {
  return `\nTurn off second email: ${unsubscribeUrl}`;
}

export function buildDailyRoutineEmail(params: {
  firstName: string;
  weekNumber: number;
  dayOfWeek: number;
  tasks: Array<{ type: string; title: string; target: string; focus?: string }>;
  streak: number;
  knownFor: string | null;
  coachWeekBox?: { focus: string; note: string } | null;
}) {
  const subject = `Week ${params.weekNumber}, Day ${params.dayOfWeek}: your routine is ready`;
  const headline = `Today's work, ${params.firstName}.`;
  const intro =
    "Here's what's on your list. Get the reps in, leave a real note on each one, and I'll see all of it.";
  const streakLine =
    params.streak > 0
      ? `You're on a ${params.streak}-day streak. Keep it going.`
      : "Finish everything today to start a streak.";
  const todayUrl = getPublicAppUrl();

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">${escapeHtml(headline)}</h1>
      <p style="margin:0 0 20px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${escapeHtml(intro)}</p>
      ${params.coachWeekBox ? buildCoachWeekBoxHtml(params.coachWeekBox) : ""}
      ${params.coachWeekBox ? `<div style="height:20px; line-height:20px; font-size:0;">&nbsp;</div>` : ""}
      ${buildTaskListHtml(params.tasks)}
      <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:#0A1628;">${escapeHtml(streakLine)}</p>
      ${buildEmailButton("Open Today", todayUrl)}
      <div style="height:20px; line-height:20px; font-size:0;">&nbsp;</div>
      ${buildKnownForBoxHtml(params.knownFor)}
      ${buildPlayerSettingsFooterHtml()}`;

  const text = `${headline}\n\n${intro}${params.coachWeekBox ? buildCoachWeekBoxText(params.coachWeekBox) : ""}\n\n${buildTaskListText(params.tasks)}\n\n${streakLine}\n\nOpen Today: ${todayUrl}${buildKnownForBoxText(params.knownFor)}${buildPlayerSettingsFooterText()}\n\n${buildEmailFooterText()}`;

  return {
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml }),
    text,
  };
}

export function buildDayBeforeStartEmail(params: {
  firstName: string;
  knownFor: string | null;
}) {
  const subject = `You start tomorrow, ${params.firstName}`;
  const headline = "Day 1 is tomorrow.";
  const body =
    "Tomorrow morning you'll get your first routine. Twelve weeks from now, you're going to be a different player. Get some sleep.";

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">${escapeHtml(headline)}</h1>
      <p style="margin:0 0 20px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${escapeHtml(body)}</p>
      ${buildKnownForBoxHtml(params.knownFor)}
      ${buildPlayerSettingsFooterHtml()}`;

  const text = `${headline}\n\n${body}${buildKnownForBoxText(params.knownFor)}${buildPlayerSettingsFooterText()}\n\n${buildEmailFooterText()}`;

  return {
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml }),
    text,
  };
}

export function buildSaturdayVideoReminderEmail(params: { firstName: string }) {
  const subject = "Your video for this week is due Sunday night";
  const headline = "I haven't seen your video yet.";
  const body =
    "Send me one video before Sunday night. Swing, fielding, a question, anything you want me to look at. I'll get back to you this week.";
  const submissionUrl = `${getPublicAppUrl()}/coaching-submissions`;

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">${escapeHtml(headline)}</h1>
      <p style="margin:0 0 20px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${escapeHtml(body)}</p>
      ${buildEmailButton("Send my video", submissionUrl)}
      ${buildPlayerSettingsFooterHtml()}`;

  const text = `${headline}\n\n${body}\n\nSend my video: ${submissionUrl}${buildPlayerSettingsFooterText()}\n\n${buildEmailFooterText()}`;

  return {
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml }),
    text,
  };
}

export function buildGoneQuietEmail(params: { firstName: string }) {
  const subject = `Haven't heard from you, ${params.firstName}`;
  const headline = "Two days off. It happens.";
  const body =
    "What matters is what you do next. Open today's routine and get one thing done. Just one. Then leave me a note so I know you're back.";
  const todayUrl = getPublicAppUrl();

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">${escapeHtml(headline)}</h1>
      <p style="margin:0 0 20px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${escapeHtml(body)}</p>
      ${buildEmailButton("Open Today", todayUrl)}
      ${buildPlayerSettingsFooterHtml()}`;

  const text = `${headline}\n\n${body}\n\nOpen Today: ${todayUrl}${buildPlayerSettingsFooterText()}\n\n${buildEmailFooterText()}`;

  return {
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml }),
    text,
  };
}

export function buildParentSaturdayVideoEmail(params: {
  playerFirstName: string;
  unsubscribeUrl: string;
}) {
  const subject = `${params.playerFirstName}'s weekly video is due Sunday night`;
  const body = `${params.playerFirstName} hasn't sent this week's video yet. It's due Sunday night so I can review it this week. Swing, fielding, or a question all count.`;

  const bodyContentHtml = `<p style="margin:0 0 12px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${escapeHtml(body)}</p>
      ${buildParentUnsubscribeFooterHtml(params.unsubscribeUrl)}`;

  const text = `${body}${buildParentUnsubscribeFooterText(params.unsubscribeUrl)}\n\n${buildEmailFooterText()}`;

  return {
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml }),
    text,
  };
}

export function buildParentGoneQuietEmail(params: {
  playerFirstName: string;
  tasks: Array<{ title: string; target: string }>;
  unsubscribeUrl: string;
}) {
  const subject = `${params.playerFirstName} hasn't logged work in 2 days`;
  const intro = `A little nudge goes a long way. Here's what's on ${params.playerFirstName}'s list today:`;
  const taskLines = params.tasks
    .map(
      (task) =>
        `<li style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#0A1628;">${escapeHtml(task.title)} - ${escapeHtml(task.target)}</li>`,
    )
    .join("");

  const bodyContentHtml = `<p style="margin:0 0 12px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${escapeHtml(intro)}</p>
      <ul style="margin:0 0 16px 20px; padding:0;">${taskLines}</ul>
      ${buildParentUnsubscribeFooterHtml(params.unsubscribeUrl)}`;

  const taskText = params.tasks.map((task) => `- ${task.title} - ${task.target}`).join("\n");
  const text = `${intro}\n${taskText}${buildParentUnsubscribeFooterText(params.unsubscribeUrl)}\n\n${buildEmailFooterText()}`;

  return {
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml }),
    text,
  };
}

export function buildParentWeeklyRecapEmail(params: {
  playerFirstName: string;
  weekNumber: number;
  tasksCompleted: number;
  tasksTotal: number;
  streak: number;
  daysFullyDone: number;
  gamesAndPractices: string[];
  weekFocus: string | null;
  weekFocusNote: string | null;
  weeklyVideoSent: boolean;
  bestNotes: string[];
  nextWeekPhase: string;
  messagesThisWeek: number;
  coachVideosThisWeek: number;
  parentMessagesUrl: string;
  unsubscribeUrl: string;
}) {
  const subject = `${params.playerFirstName}'s week ${params.weekNumber} recap`;
  const programUrl = `${getPublicAppUrl()}/program`;

  const gamesHtml =
    params.gamesAndPractices.length > 0
      ? `<ul style="margin:0 0 0 20px; padding:0;">${params.gamesAndPractices
          .map(
            (line) =>
              `<li style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#0A1628;">${escapeHtml(line)}</li>`,
          )
          .join("")}</ul>`
      : `<p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#6B7280;">None logged this week.</p>`;

  const focusHtml =
    params.weekFocus && params.weekFocusNote
      ? `<p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#0A1628;"><strong>Hitting focus:</strong> ${escapeHtml(params.weekFocus)}</p>
         <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#0A1628;">${escapeHtml(params.weekFocusNote)}</p>`
      : `<p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#6B7280;">No custom focus set this week.</p>`;

  const notesHtml =
    params.bestNotes.length > 0
      ? `<ul style="margin:0 0 0 20px; padding:0;">${params.bestNotes
          .map(
            (note) =>
              `<li style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; font-style:italic; color:#0A1628;">"${escapeHtml(note)}"</li>`,
          )
          .join("")}</ul>`
      : `<p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#6B7280;">No notes this week.</p>`;

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">Week ${params.weekNumber} recap</h1>
      ${buildEmailSectionLabel("PROGRESS")}
      <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#0A1628;">Tasks completed: ${params.tasksCompleted} of ${params.tasksTotal}</p>
      <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#0A1628;">Current streak: ${params.streak} day${params.streak === 1 ? "" : "s"}</p>
      <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#0A1628;">Days fully done: ${params.daysFullyDone}</p>
      ${buildEmailSectionLabel("GAMES AND PRACTICES")}
      ${gamesHtml}
      ${buildEmailSectionLabel("HITTING FOCUS")}
      ${focusHtml}
      ${buildEmailSectionLabel("WEEKLY VIDEO")}
      <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#0A1628;">${params.weeklyVideoSent ? "Sent this week." : "Not sent this week."}</p>
      ${buildEmailSectionLabel("BEST NOTES")}
      ${notesHtml}
      ${buildEmailSectionLabel("NEXT WEEK")}
      <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#0A1628;">Phase: ${escapeHtml(params.nextWeekPhase)}</p>
      ${
        params.coachVideosThisWeek > 0
          ? `<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#0A1628;">Coach Broc sent ${params.coachVideosThisWeek} video${params.coachVideosThisWeek === 1 ? "" : "s"} this week</p>`
          : ""
      }
      ${
        params.messagesThisWeek > 0
          ? `<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#0A1628;">${escapeHtml(params.playerFirstName)} and Coach Broc exchanged ${params.messagesThisWeek} message${params.messagesThisWeek === 1 ? "" : "s"} this week</p>
      ${buildEmailButton("View messages", params.parentMessagesUrl)}`
          : ""
      }
      ${buildEmailButton("See the program", programUrl)}
      ${buildParentUnsubscribeFooterHtml(params.unsubscribeUrl)}`;

  const gamesText =
    params.gamesAndPractices.length > 0
      ? params.gamesAndPractices.map((line) => `- ${line}`).join("\n")
      : "None logged this week.";
  const notesText =
    params.bestNotes.length > 0
      ? params.bestNotes.map((note) => `- "${note}"`).join("\n")
      : "No notes this week.";

  const text = `Week ${params.weekNumber} recap for ${params.playerFirstName}

PROGRESS
Tasks completed: ${params.tasksCompleted} of ${params.tasksTotal}
Current streak: ${params.streak} days
Days fully done: ${params.daysFullyDone}

GAMES AND PRACTICES
${gamesText}

HITTING FOCUS
${params.weekFocus ? `${params.weekFocus}\n${params.weekFocusNote ?? ""}` : "No custom focus set this week."}

WEEKLY VIDEO
${params.weeklyVideoSent ? "Sent this week." : "Not sent this week."}

BEST NOTES
${notesText}

NEXT WEEK
Phase: ${params.nextWeekPhase}
${
  params.coachVideosThisWeek > 0
    ? `\nCoach Broc sent ${params.coachVideosThisWeek} video${params.coachVideosThisWeek === 1 ? "" : "s"} this week\n`
    : ""
}${
  params.messagesThisWeek > 0
    ? `\n${params.playerFirstName} and Coach Broc exchanged ${params.messagesThisWeek} message${params.messagesThisWeek === 1 ? "" : "s"} this week\nView messages: ${params.parentMessagesUrl}\n`
    : ""
}
See the program: ${programUrl}${buildParentUnsubscribeFooterText(params.unsubscribeUrl)}

${buildEmailFooterText()}`;

  return {
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml }),
    text,
  };
}

export function buildCoachDailySummaryEmail(params: {
  finished: number;
  active: number;
  finishedNames: string[];
  notFinished: Array<{ name: string; done: number; total: number }>;
  goneQuietNames: string[];
  newNotesCount: number;
  recentNotes: Array<{ playerName: string; taskTitle: string; note: string }>;
  gamesLoggedToday: Array<{ name: string; line: string }>;
  videosWaiting: number;
  unreadMessagesCount: number;
}) {
  const subject = `Program today: ${params.finished} of ${params.active} finished`;
  const adminUrl = `${getPublicAppUrl()}/admin/program`;

  const finishedHtml =
    params.finishedNames.length > 0
      ? params.finishedNames.map((name) => escapeHtml(name)).join(", ")
      : "None";

  const notFinishedHtml =
    params.notFinished.length > 0
      ? `<ul style="margin:0 0 0 20px; padding:0;">${params.notFinished
          .map(
            (entry) =>
              `<li style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#0A1628;">${escapeHtml(entry.name)} (${entry.done} of ${entry.total})</li>`,
          )
          .join("")}</ul>`
      : `<p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#6B7280;">None</p>`;

  const goneQuietHtml =
    params.goneQuietNames.length > 0
      ? `<p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#DC2626;">${params.goneQuietNames.map((name) => escapeHtml(name)).join(", ")}</p>`
      : `<p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#6B7280;">None</p>`;

  const notesHtml =
    params.recentNotes.length > 0
      ? `<ul style="margin:8px 0 0 20px; padding:0;">${params.recentNotes
          .map(
            (entry) =>
              `<li style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#0A1628;"><strong>${escapeHtml(entry.playerName)}</strong> (${escapeHtml(entry.taskTitle)}): "${escapeHtml(entry.note)}"</li>`,
          )
          .join("")}</ul>`
      : "";

  const gamesHtml =
    params.gamesLoggedToday.length > 0
      ? `<ul style="margin:0 0 0 20px; padding:0;">${params.gamesLoggedToday
          .map(
            (entry) =>
              `<li style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#0A1628;">${escapeHtml(entry.name)}: ${escapeHtml(entry.line)}</li>`,
          )
          .join("")}</ul>`
      : `<p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#6B7280;">None</p>`;

  const bodyContentHtml = `${buildEmailSectionLabel("FINISHED TODAY")}
      <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#0A1628;">${finishedHtml}</p>
      ${buildEmailSectionLabel("NOT FINISHED")}
      ${notFinishedHtml}
      ${buildEmailSectionLabel("GONE QUIET")}
      ${goneQuietHtml}
      ${buildEmailSectionLabel("NEW NOTES TODAY")}
      <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#0A1628;">${params.newNotesCount} new note${params.newNotesCount === 1 ? "" : "s"}</p>
      ${notesHtml}
      ${buildEmailSectionLabel("GAMES LOGGED TODAY")}
      ${gamesHtml}
      ${buildEmailSectionLabel("VIDEOS WAITING FOR YOU")}
      <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#0A1628;">${params.videosWaiting}</p>
      ${buildEmailSectionLabel("UNREAD MESSAGES")}
      <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#0A1628;">${params.unreadMessagesCount}</p>
      ${buildEmailButton("Open program overview", adminUrl)}`;

  const notFinishedText =
    params.notFinished.length > 0
      ? params.notFinished.map((entry) => `- ${entry.name} (${entry.done} of ${entry.total})`).join("\n")
      : "None";
  const notesText =
    params.recentNotes.length > 0
      ? params.recentNotes
          .map((entry) => `- ${entry.playerName} (${entry.taskTitle}): "${entry.note}"`)
          .join("\n")
      : "";
  const gamesText =
    params.gamesLoggedToday.length > 0
      ? params.gamesLoggedToday.map((entry) => `- ${entry.name}: ${entry.line}`).join("\n")
      : "None";

  const text = `Program today: ${params.finished} of ${params.active} finished

FINISHED TODAY
${params.finishedNames.length > 0 ? params.finishedNames.join(", ") : "None"}

NOT FINISHED
${notFinishedText}

GONE QUIET
${params.goneQuietNames.length > 0 ? params.goneQuietNames.join(", ") : "None"}

NEW NOTES TODAY
${params.newNotesCount} new notes
${notesText}

GAMES LOGGED TODAY
${gamesText}

VIDEOS WAITING FOR YOU
${params.videosWaiting}

UNREAD MESSAGES
${params.unreadMessagesCount}

Open program overview: ${adminUrl}

${buildEmailFooterText()}`;

  return {
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml }),
    text,
  };
}
