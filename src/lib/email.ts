import nodemailer from "nodemailer";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function getSmtpConfig() {
  return {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM ?? "noreply@cs2-errornotes.com",
  };
}

function createTransport() {
  const { host, port, user, pass } = getSmtpConfig();
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<void> {
  const { from } = getSmtpConfig();
  const transport = createTransport();
  if (!transport) {
    const match = html.match(/href="([^"]+)"/);
    const link = match ? match[1] : "(no link found)";
    console.log(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
    console.log(`[DEV EMAIL] Link: ${link}`);
    return;
  }

  const info = await transport.sendMail({
    from: `"CS2 Error Notes" <${from}>`,
    to,
    subject,
    html,
    text: text ?? html.replace(/<[^>]+>/g, ""),
    headers: {
      "List-Unsubscribe": `<mailto:${from}>`,
      "X-Mailer": "CS2 Error Notes",
      "X-Priority": "3",
    },
  });
  console.log(`[EMAIL SENT] To: ${to} | MessageId: ${info.messageId}`);
}

export function renderEmailTemplate({ title, body }: { title: string; body: string }): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; background: #0f0f0f; color: #e4e4e7; }
  .container { max-width: 480px; margin: 40px auto; padding: 24px; background: #1a1a1e; border-radius: 12px; border: 1px solid #27272a; }
  .logo { font-size: 20px; font-weight: 700; color: #f97316; margin-bottom: 16px; }
  h1 { font-size: 18px; margin: 0 0 12px; color: #e4e4e7; }
  p { line-height: 1.6; color: #a1a1aa; margin: 0 0 16px; }
  a { color: #f97316; }
</style>
</head>
<body>
<div class="container">
  <div class="logo">CS2 Error Notes</div>
  <h1>${title}</h1>
  ${body}
</div>
</body>
</html>`;
}
