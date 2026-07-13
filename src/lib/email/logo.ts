import "server-only";
import fs from "fs";
import path from "path";

/**
 * Shared email-header logo. Uses the same brand mark as the navbar
 * (`src/assets/bv-logo.png`).
 *
 * Email clients render each message on the recipient's device/servers, so a
 * logo URL pointing at `http://localhost:3000` (or any origin the recipient
 * can't reach) never loads. To make the logo work in every environment —
 * local dev included — we embed the image directly in the email as a CID
 * attachment instead of linking to a URL. `<img src="cid:bv-logo">` then
 * resolves to the attached file, no network fetch required.
 */
const LOGO_CID = "bv-logo";
const LOGO_PATH = path.join(process.cwd(), "public", "logo.png");

let cachedLogo: Buffer | null | undefined;

/** Read the logo file once and cache it in memory for the process lifetime. */
function readLogo(): Buffer | null {
  if (cachedLogo !== undefined) return cachedLogo;
  try {
    cachedLogo = fs.readFileSync(LOGO_PATH);
  } catch (err) {
    console.warn("[email/logo] Could not read logo file at", LOGO_PATH, err);
    cachedLogo = null;
  }
  return cachedLogo;
}

/** Nodemailer `attachments` entry embedding the logo inline via CID. */
export function emailLogoAttachment(): { filename: string; content: Buffer; cid: string }[] {
  const buf = readLogo();
  if (!buf) return [];
  return [{ filename: "logo.png", content: buf, cid: LOGO_CID }];
}

/** Consistent logo header markup dropped at the top of every email template. */
export function emailLogoHeaderHtml(): string {
  return `<div style="margin-bottom:24px">
    <img src="cid:${LOGO_CID}" alt="BriefVault" width="132" height="36" style="display:block;height:36px;width:auto" />
  </div>`;
}
