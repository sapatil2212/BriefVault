import nodemailer, { type Transporter } from "nodemailer";
import { emailLogoHeaderHtml, emailLogoAttachment } from "@/lib/email/logo";

/**
 * Transactional emails for the registration → approval → activation workflow.
 * Mirrors the OTP mailer (lib/auth/mailer): if SMTP isn't configured we log to
 * the console so the flow stays testable in local dev.
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

/** Shared shell so every email looks consistent. */
function shell(title: string, bodyHtml: string): string {
  return `
  <div style="font-family:Figtree,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#0f172a">
    ${emailLogoHeaderHtml()}
    <h1 style="font-size:20px;margin:0 0 16px">${title}</h1>
    ${bodyHtml}
    <p style="font-size:13px;color:#94a3b8;margin:28px 0 0">© BriefVault. This is an automated message.</p>
  </div>`;
}

function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:8px;padding:11px 20px;background:#1E40AF;color:#fff;border-radius:8px;font-weight:600;text-decoration:none">${label}</a>`;
}

/** Sent immediately after signup to acknowledge receipt. */
export function sendRegistrationReceivedEmail(to: string, name: string, planName: string) {
  const subject = "We received your BriefVault registration";
  const text = `Hi ${name},\n\nThanks for signing up for the ${planName} plan. Please verify your email to continue.`;
  const html = shell(
    "Registration received",
    `<p style="font-size:15px;color:#475569">Hi ${name}, thanks for signing up for the <strong>${planName}</strong> plan. Please verify your email address to continue.</p>`
  );
  return send(to, subject, text, html);
}

/** Sent to a paid-plan user once their email is verified and approval is pending. */
export function sendPendingApprovalEmail(to: string, name: string, planName: string) {
  const subject = "Your BriefVault account is awaiting approval";
  const text = `Hi ${name},\n\nYour email is verified. Your ${planName} plan requires approval by the BriefVault team. We'll email you once it's approved.`;
  const html = shell(
    "Awaiting approval",
    `<p style="font-size:15px;color:#475569">Hi ${name}, your email is verified. The <strong>${planName}</strong> plan requires a quick review by the BriefVault team before access is granted.</p>
     <p style="font-size:15px;color:#475569">You'll receive an email as soon as your account is approved. Current status: <strong style="color:#b45309">🟡 Pending approval</strong>.</p>`
  );
  return send(to, subject, text, html);
}

/** Sent when an admin approves the account. */
export function sendAccountApprovedEmail(to: string, name: string, planName: string) {
  const subject = "Your BriefVault account is approved 🎉";
  const text = `Hi ${name},\n\nGood news — your ${planName} account has been approved. Sign in at ${APP_URL}/signin`;
  const html = shell(
    "You're approved 🎉",
    `<p style="font-size:15px;color:#475569">Hi ${name}, your <strong>${planName}</strong> account has been approved and your subscription is now active. You can sign in and start working.</p>
     ${button("Sign in to BriefVault", `${APP_URL}/signin`)}`
  );
  return send(to, subject, text, html);
}

/** Sent when an admin rejects the account, with an optional reason. */
export function sendAccountRejectedEmail(to: string, name: string, reason?: string) {
  const subject = "Update on your BriefVault registration";
  const reasonText = reason ? `\n\nReason: ${reason}` : "";
  const text = `Hi ${name},\n\nAfter review, we're unable to approve your BriefVault account at this time.${reasonText}\n\nIf you believe this is a mistake, reply to this email.`;
  const html = shell(
    "Registration update",
    `<p style="font-size:15px;color:#475569">Hi ${name}, after review we're unable to approve your BriefVault account at this time.</p>
     ${reason ? `<p style="font-size:15px;color:#475569"><strong>Reason:</strong> ${reason}</p>` : ""}
     <p style="font-size:15px;color:#475569">If you think this was a mistake, just reply to this email and our team will take another look.</p>`
  );
  return send(to, subject, text, html);
}

/** Sent when an admin requests more information from the applicant. */
export function sendInfoRequestedEmail(to: string, name: string, message: string) {
  const subject = "We need a bit more information — BriefVault";
  const text = `Hi ${name},\n\nBefore approving your account, we need some more information:\n\n${message}\n\nPlease reply to this email.`;
  const html = shell(
    "A little more information, please",
    `<p style="font-size:15px;color:#475569">Hi ${name}, before we can approve your account we need a bit more information:</p>
     <blockquote style="margin:12px 0;padding:12px 16px;background:#f8fafc;border-left:3px solid #1E40AF;color:#334155">${message}</blockquote>
     <p style="font-size:15px;color:#475569">Please reply to this email with the details.</p>`
  );
  return send(to, subject, text, html);
}

/** Sent to a free-plan user (or on approval) confirming the subscription is live. */
export function sendSubscriptionActivatedEmail(to: string, name: string, planName: string) {
  const subject = "Your BriefVault subscription is active";
  const text = `Hi ${name},\n\nYour ${planName} subscription is now active. Sign in at ${APP_URL}/signin`;
  const html = shell(
    "Subscription activated",
    `<p style="font-size:15px;color:#475569">Hi ${name}, your <strong>${planName}</strong> subscription is now active. Welcome to BriefVault!</p>
     ${button("Go to your dashboard", `${APP_URL}/dashboard`)}`
  );
  return send(to, subject, text, html);
}

/** Notify the platform super admin that a new paid registration needs review. */
export function notifySuperAdminNewRegistration(name: string, email: string, planName: string, organization: string) {
  const to = process.env.SUPER_ADMIN_EMAIL ?? process.env.SUPER_ADMIN_USERNAME;
  if (!to) {
    console.info(`\n[BriefVault] New ${planName} registration pending approval: ${name} <${email}> (${organization})\n`);
    return Promise.resolve({ delivered: false as const });
  }
  const subject = `New ${planName} registration awaiting approval`;
  const text = `${name} <${email}> from ${organization} registered for the ${planName} plan and is awaiting approval.`;
  const html = shell(
    "New registration to review",
    `<p style="font-size:15px;color:#475569"><strong>${name}</strong> (${email}) from <strong>${organization}</strong> signed up for the <strong>${planName}</strong> plan and is awaiting approval.</p>
     ${button("Review pending users", `${APP_URL}/admin/pending-users`)}`
  );
  return send(to, subject, text, html);
}
