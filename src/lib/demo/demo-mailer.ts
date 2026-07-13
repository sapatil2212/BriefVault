import nodemailer, { type Transporter } from "nodemailer";
import { emailLogoHeaderHtml, emailLogoAttachment } from "@/lib/email/logo";

/**
 * Transactional emails for the public "Book a demo" / contact form. Mirrors
 * the account-mailer pattern: SMTP via nodemailer, with a console-log fallback
 * in local dev when SMTP isn't configured, so the flow stays testable.
 */

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
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

async function send(to: string, subject: string, text: string, html: string) {
  const tx = getTransporter();
  if (!tx) {
    console.info(`\n[BriefVault email → ${to}] ${subject}\n${text}\n`);
    return { delivered: false as const };
  }
  await tx.sendMail({ from: FROM, to, subject, text, html, attachments: emailLogoAttachment() });
  return { delivered: true as const };
}

/**
 * Shared card shell for demo-enquiry emails: a faint rounded border, the
 * BriefVault logo badge in the header, and a consistent footer. Distinct from
 * `account-mailer`'s `shell()` — this one wraps the whole message in a
 * bordered card per the requested "faint rounded border with our logo" look.
 */
function cardShell(bodyHtml: string): string {
  return `
  <div style="font-family:Figtree,Arial,sans-serif;background:#f8fafc;padding:32px 16px">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;color:#0f172a">
      ${emailLogoHeaderHtml()}
      ${bodyHtml}
      <div style="margin-top:28px;padding-top:20px;border-top:1px solid #f1f5f9">
        <p style="font-size:12px;color:#94a3b8;margin:0">© ${new Date().getFullYear()} BriefVault. This is an automated message.</p>
      </div>
    </div>
  </div>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:#64748b;width:130px;vertical-align:top">${label}</td>
    <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;vertical-align:top">${value}</td>
  </tr>`;
}

export interface DemoEnquiryInput {
  name: string;
  email: string;
  company: string;
  businessType: string;
  phone: string;
  whatsapp?: string;
  preferredDate?: string;
  preferredTime?: string;
  message?: string;
}

/**
 * Thank-you confirmation sent to the person who submitted the demo request.
 * Faint rounded card, logo badge, warm confirmation copy — per the requested
 * design.
 */
export function sendDemoEnquiryThankYouEmail(input: DemoEnquiryInput) {
  const subject = "Thanks for booking a demo with BriefVault";
  const text = `Hi ${input.name},\n\nThanks for reaching out! We've received your demo request for ${input.company} and our team will contact you shortly${input.preferredDate ? ` to confirm your preferred slot (${input.preferredDate} at ${input.preferredTime ?? ""})` : ""}.\n\nIf anything changes, just reply to this email.\n\n— The BriefVault Team`;

  const html = cardShell(`
    <h1 style="font-size:20px;margin:0 0 4px;color:#0f172a">Thank you, ${escapeHtml(input.name)}! 🎉</h1>
    <p style="font-size:14px;color:#475569;margin:0 0 20px">We've received your demo request and our team will reach out shortly to confirm the details.</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:8px">
      ${detailRow("Company", escapeHtml(input.company))}
      ${input.preferredDate ? detailRow("Preferred date", `${escapeHtml(input.preferredDate)}${input.preferredTime ? ` · ${escapeHtml(input.preferredTime)}` : ""}`) : ""}
      ${detailRow("Contact number", escapeHtml(input.phone))}
    </table>
    <p style="font-size:13px;color:#94a3b8;margin:20px 0 0">In the meantime, feel free to reply to this email with any questions.</p>
  `);

  return send(input.email, subject, text, html);
}

/**
 * Internal alert to the platform admin whenever a new demo enquiry arrives.
 * Uses `SUPER_ADMIN_EMAIL` if set, falling back to `SUPER_ADMIN_USERNAME`
 * (mirrors `notifySuperAdminNewRegistration` in account-mailer.ts).
 */
export function notifyAdminNewDemoEnquiry(input: DemoEnquiryInput) {
  const to = process.env.SUPER_ADMIN_EMAIL ?? process.env.SUPER_ADMIN_USERNAME;
  if (!to) {
    console.info(`\n[BriefVault] New demo enquiry: ${input.name} <${input.email}> (${input.company})\n`);
    return Promise.resolve({ delivered: false as const });
  }

  const subject = `New demo enquiry — ${input.company}`;
  const text = `${input.name} <${input.email}> from ${input.company} (${input.businessType}) requested a demo.\nPhone: ${input.phone}${input.whatsapp ? `\nWhatsApp: ${input.whatsapp}` : ""}${input.preferredDate ? `\nPreferred slot: ${input.preferredDate} ${input.preferredTime ?? ""}` : ""}${input.message ? `\n\nMessage:\n${input.message}` : ""}`;

  const html = cardShell(`
    <h1 style="font-size:20px;margin:0 0 4px;color:#0f172a">New demo enquiry</h1>
    <p style="font-size:14px;color:#475569;margin:0 0 20px"><strong>${escapeHtml(input.name)}</strong> from <strong>${escapeHtml(input.company)}</strong> just requested a demo.</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:8px">
      ${detailRow("Email", escapeHtml(input.email))}
      ${detailRow("Phone", escapeHtml(input.phone))}
      ${input.whatsapp ? detailRow("WhatsApp", escapeHtml(input.whatsapp)) : ""}
      ${detailRow("Business type", escapeHtml(input.businessType))}
      ${input.preferredDate ? detailRow("Preferred slot", `${escapeHtml(input.preferredDate)}${input.preferredTime ? ` · ${escapeHtml(input.preferredTime)}` : ""}`) : ""}
    </table>
    ${input.message ? `<blockquote style="margin:12px 0 0;padding:12px 16px;background:#f8fafc;border-left:3px solid #1E40AF;color:#334155;font-size:13px;border-radius:8px">${escapeHtml(input.message)}</blockquote>` : ""}
    <a href="${APP_URL}/admin/demo-enquiries" style="display:inline-block;margin-top:20px;padding:11px 20px;background:#1E40AF;color:#fff;border-radius:8px;font-weight:600;text-decoration:none;font-size:13px">Review in Admin</a>
  `);

  return send(to, subject, text, html);
}

/** Minimal HTML escaping for user-supplied strings embedded in email markup. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
