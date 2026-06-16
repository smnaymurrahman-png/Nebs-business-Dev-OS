import nodemailer from "nodemailer";

interface Recipient {
  name: string;
  email: string;
}

interface MeetingEmailData {
  topic: string;
  scheduledAt: Date;
  locationType: "ONLINE" | "OFFLINE";
  meetingLink?: string | null;
  meetingLocation?: string | null;
  leadName: string;
  recipients: Recipient[];
}

function isSmtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendMeetingInvite(data: MeetingEmailData) {
  if (!isSmtpConfigured()) {
    console.warn("[email] SMTP not configured — skipping meeting invite emails");
    return;
  }

  const { topic, scheduledAt, locationType, meetingLink, meetingLocation, leadName, recipients } = data;
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@nebs.com";

  const dateStr = scheduledAt.toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit",
    timeZone: "Asia/Dhaka",
  });

  const locationLine =
    locationType === "ONLINE"
      ? `<strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a>`
      : `<strong>Location:</strong> ${meetingLocation}`;

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#1d4ed8">Meeting Scheduled — Nebs BD</h2>
      <p>You have been invited to the following meeting:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#6b7280;width:140px">Topic</td><td style="padding:8px;font-weight:600">${topic}</td></tr>
        <tr><td style="padding:8px;color:#6b7280">Lead</td><td style="padding:8px">${leadName}</td></tr>
        <tr><td style="padding:8px;color:#6b7280">Date & Time</td><td style="padding:8px">${dateStr} (BST)</td></tr>
        <tr><td style="padding:8px;color:#6b7280">${locationType === "ONLINE" ? "Link" : "Location"}</td><td style="padding:8px">${locationLine}</td></tr>
      </table>
      <p style="color:#6b7280;font-size:13px">This email was sent by Nebs BD OS. Please do not reply.</p>
    </div>
  `;

  const transporter = createTransport();

  await Promise.allSettled(
    recipients.map((r) =>
      transporter.sendMail({
        from: `"Nebs BD" <${from}>`,
        to: `"${r.name}" <${r.email}>`,
        subject: `Meeting: ${topic}`,
        html,
      })
    )
  );
}
