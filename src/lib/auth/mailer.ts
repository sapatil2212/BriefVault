import nodemailer, { type Transporter } from "nodemailer";
import { OTP_TTL_MINUTES } from "@/lib/auth/otp";
import { emailLogoHeaderHtml, emailLogoAttachment } from "@/lib/email/logo";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
    });
  }
  return transporter;
}

const FROM = process.env.EMAIL_FROM ?? "BriefVault <no-reply@briefvault.ai>";

export async function sendOtpEmail(to: string, code: string, name?: string) {
  const subject = `${code} is your BriefVault verification code`;
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const text = `${greeting}\n\nYour BriefVault verification code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.\n\nIf you didn't request this, you can safely ignore this email.`;
  const html = otpEmailHtml(code, greeting);

  const tx = getTransporter();

  if (!tx) {
    // Dev fallback: no SMTP configured — log the code so the flow is testable.
    console.info(
      `\n[BriefVault] OTP for ${to}: ${code} (expires in ${OTP_TTL_MINUTES} min)\n`
    );
    return { delivered: false as const };
  }

  await tx.sendMail({ from: FROM, to, subject, text, html, attachments: emailLogoAttachment() });
  return { delivered: true as const };
}

function otpEmailHtml(code: string, greeting: string): string {
  return `
  <div style="font-family:Figtree,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;color:#0f172a">
    ${emailLogoHeaderHtml()}
    <p style="font-size:15px;margin:0 0 12px">${greeting}</p>
    <p style="font-size:15px;color:#475569;margin:0 0 24px">Use the verification code below to finish creating your account. It expires in ${OTP_TTL_MINUTES} minutes.</p>
    <div style="font-size:34px;font-weight:700;letter-spacing:10px;text-align:center;padding:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;color:#1E40AF">${code}</div>
    <p style="font-size:13px;color:#94a3b8;margin:24px 0 0">If you didn't request this, you can safely ignore this email.</p>
  </div>`;
}
