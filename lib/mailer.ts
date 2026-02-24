import nodemailer from "nodemailer";

export async function sendEmail(subject: string, body: string) {
  const host = process.env.SMTP_HOST || "";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const to = process.env.MAIL_TO || "";

  if (!host || !user || !pass || !to) return;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: { user, pass }
  });

  await transporter.sendMail({
    from: user,
    to,
    subject,
    text: body
  });
}
