// lib/email.js
//
// Email service for transactional auth flows.
// Default uses Resend (https://resend.com). Swap the send() body
// for SendGrid, Postmark, AWS SES, or your own SMTP.
//
// Env vars required:
//   EMAIL_FROM           — sender address e.g. "Brick & Wealth <noreply@brickandwealth.com>"
//   RESEND_API_KEY       — your Resend API key (or replace impl below)
//   APP_URL              — full URL e.g. "https://brickandwealth.com"

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || "company@bitlayerx.com";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

// ─── CORE SENDER ──────────────────────────────────────────────────────────────
async function send({ to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY) {
    // No API key — print to terminal so the token is still accessible in dev
    console.log("─── EMAIL (no RESEND_API_KEY — dev fallback) ──────");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text:\n${text}`);
    console.log("───────────────────────────────────────────────────");
    return { id: "dev-email" };
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
  return data;
}

// ─── REGISTRATION VERIFICATION EMAIL ──────────────────────────────────────────
export async function sendRegistrationEmail({ to, fullName, token }) {
  const verifyUrl = `${APP_URL}/portal/verify?token=${encodeURIComponent(token)}`;
  const subject = "Complete your Brick & Wealth registration";

  const text = [
    `Hi ${fullName},`,
    ``,
    `Welcome to Brick & Wealth. To complete your registration and set your password, click the link below:`,
    ``,
    verifyUrl,
    ``,
    `This link expires in 4 hours and can only be used once.`,
    ``,
    `If you didn't request this, you can safely ignore this email.`,
    ``,
    `— The Brick & Wealth Team`,
  ].join("\n");

  const html = renderEmailTemplate({
    preheader: "Click the link to set your password and complete your registration.",
    heading: "Welcome to Brick & Wealth",
    greeting: `Hi ${escapeHtml(fullName)},`,
    body: "Thank you for requesting an account. To complete your registration and set your password, please click the button below.",
    ctaLabel: "Complete Registration",
    ctaUrl: verifyUrl,
    expiryNotice: "This link expires in <strong>4 hours</strong> and can only be used once.",
    fallbackText: "If the button doesn't work, copy and paste this link into your browser:",
    fallbackUrl: verifyUrl,
    footnote: "If you didn't request this, you can safely ignore this email.",
  });

  return send({ to, subject, html, text });
}

// ─── REGISTRATION APPROVED EMAIL (sent by admin on approval) ─────────────────
export async function sendRegistrationApprovedEmail({ to, fullName, token }) {
  const verifyUrl = `${APP_URL}/portal/verify?token=${encodeURIComponent(token)}`;
  const subject = "Your Brick & Wealth application has been approved";

  const text = [
    `Hi ${fullName},`,
    ``,
    `Great news — your registration has been approved by our team.`,
    ``,
    `Click the link below to set your password and complete your onboarding:`,
    ``,
    verifyUrl,
    ``,
    `This link expires in 4 hours and can only be used once.`,
    ``,
    `— The Brick & Wealth Team`,
  ].join("\n");

  const html = renderEmailTemplate({
    preheader: "Your registration has been approved — click to set your password.",
    heading: "Application Approved",
    greeting: `Hi ${escapeHtml(fullName)},`,
    body: "Great news — your registration has been reviewed and approved by our team. Click the button below to set your password and begin your onboarding.",
    ctaLabel: "Set Password & Continue",
    ctaUrl: verifyUrl,
    expiryNotice: "This link expires in <strong>4 hours</strong> and can only be used once.",
    fallbackText: "If the button doesn't work, copy and paste this link into your browser:",
    fallbackUrl: verifyUrl,
    footnote: "If you didn't request this, please contact support@brickandwealth.com.",
  });

  return send({ to, subject, html, text });
}

// ─── REGISTRATION DECLINED EMAIL ─────────────────────────────────────────────
export async function sendRegistrationDeclinedEmail({ to, fullName, reason }) {
  const subject = "Update on your Brick & Wealth application";

  const bodyText = reason
    ? `After reviewing your application, we're unable to proceed at this time. Reason: ${reason}`
    : "After reviewing your application, we're unable to proceed at this time.";

  const text = [
    `Hi ${fullName},`,
    ``,
    bodyText,
    ``,
    `If you believe this is an error or have questions, please contact us at support@brickandwealth.com.`,
    ``,
    `— The Brick & Wealth Team`,
  ].join("\n");

  const html = renderEmailTemplate({
    preheader: "An update regarding your Brick & Wealth registration.",
    heading: "Application Update",
    greeting: `Hi ${escapeHtml(fullName)},`,
    body: reason
      ? `After reviewing your application, we're unable to proceed at this time.<br><br><strong>Reason:</strong> ${escapeHtml(reason)}`
      : "After reviewing your application, we're unable to proceed at this time.",
    ctaLabel: "Contact Support",
    ctaUrl: `mailto:support@brickandwealth.com`,
    expiryNotice: "If you believe this is an error, please reach out to our support team.",
    fallbackText: "You can also email us directly at:",
    fallbackUrl: "support@brickandwealth.com",
    footnote: "This decision was made by our compliance team. We appreciate your interest in Brick & Wealth.",
  });

  return send({ to, subject, html, text });
}

// ─── PASSWORD RESET EMAIL ─────────────────────────────────────────────────────
export async function sendPasswordResetEmail({ to, fullName, token }) {
  const resetUrl = `${APP_URL}/portal/reset?token=${encodeURIComponent(token)}`;
  const subject = "Reset your Brick & Wealth password";

  const text = [
    `Hi ${fullName},`,
    ``,
    `We received a request to reset the password for your Brick & Wealth account. Click the link below to set a new password:`,
    ``,
    resetUrl,
    ``,
    `This link expires in 4 hours and can only be used once.`,
    ``,
    `If you didn't request this, you can safely ignore this email — your password will remain unchanged.`,
    ``,
    `— The Brick & Wealth Team`,
  ].join("\n");

  const html = renderEmailTemplate({
    preheader: "Click the link to securely reset your Brick & Wealth password.",
    heading: "Password Reset Request",
    greeting: `Hi ${escapeHtml(fullName || "there")},`,
    body: "We received a request to reset the password for your Brick & Wealth account. Click the button below to set a new password.",
    ctaLabel: "Reset Password",
    ctaUrl: resetUrl,
    expiryNotice: "This link expires in <strong>4 hours</strong> and can only be used once.",
    fallbackText: "If the button doesn't work, copy and paste this link into your browser:",
    fallbackUrl: resetUrl,
    footnote: "If you didn't request this, you can safely ignore this email — your password will remain unchanged.",
  });

  return send({ to, subject, html, text });
}

// ─── NEW LEAD NOTIFICATION (to the investor team) ─────────────────────────────
// Fired when a prospect submits the public "Register Interest" form. Sent to
// the team inbox (ADMIN_EMAIL) so a human can follow up — the lead is also
// stored in the admin Leads dashboard regardless of whether this send succeeds.
// Human-readable labels for the multi-step "Register Interest" qualifiers.
const LEAD_LABELS = {
  investorType: { uk: "UK-based", diaspora: "Diaspora" },
  budgetRange: {
    under_25k: "Under £25,000",
    "25k_100k": "£25,000 – £100,000",
    "100k_500k": "£100,000 – £500,000",
    over_500k: "Over £500,000",
  },
  interestType: {
    co_ownership: "Co-ownership",
    buy_to_let: "Buy-to-let",
    buy_to_own: "Buy-to-own",
  },
};
function leadLabel(field, value) {
  return (value && LEAD_LABELS[field]?.[value]) || null;
}

export async function sendLeadNotificationEmail({ name, email, location, message, source, investorType, budgetRange, interestType }) {
  const to = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM;
  if (!to) return { id: "no-recipient" };

  const subject = `New interest: ${name} (${location})`;
  const leadsUrl = `${APP_URL}/admin/leads`;

  const investorLbl = leadLabel("investorType", investorType);
  const budgetLbl = leadLabel("budgetRange", budgetRange);
  const interestLbl = leadLabel("interestType", interestType);

  const lines = [
    `A new prospect registered their interest via the website.`,
    ``,
    `Name:     ${name}`,
    `Email:    ${email}`,
    `Location: ${location}`,
    investorLbl ? `Investor: ${investorLbl}` : ``,
    budgetLbl ? `Budget:   ${budgetLbl}` : ``,
    interestLbl ? `Interest: ${interestLbl}` : ``,
    `Source:   ${source || "website"}`,
    message ? `\nMessage:\n${message}` : ``,
    ``,
    `Review and triage in the admin Leads dashboard:`,
    leadsUrl,
  ];
  const text = lines.filter((l) => l !== undefined && l !== "").join("\n");

  const qualifierHtml = [
    investorLbl ? `<strong>Investor type:</strong> ${escapeHtml(investorLbl)}<br>` : "",
    budgetLbl ? `<strong>Budget:</strong> ${escapeHtml(budgetLbl)}<br>` : "",
    interestLbl ? `<strong>Interest:</strong> ${escapeHtml(interestLbl)}<br>` : "",
  ].join("");

  const html = renderEmailTemplate({
    preheader: `${name} from ${location} just registered interest.`,
    heading: "New Investor Interest",
    greeting: "A new prospect just reached out.",
    body:
      `<strong>${escapeHtml(name)}</strong> from <strong>${escapeHtml(location)}</strong> ` +
      `registered their interest.<br><br>` +
      `<strong>Email:</strong> ${escapeHtml(email)}<br>` +
      qualifierHtml +
      `<strong>Source:</strong> ${escapeHtml(source || "website")}` +
      (message ? `<br><br><strong>Message:</strong><br>${escapeHtml(message)}` : ""),
    ctaLabel: "Open Leads Dashboard",
    ctaUrl: leadsUrl,
    expiryNotice: "This prospect is now waiting in your Leads queue with status “new”.",
    fallbackText: "If the button doesn't work, copy and paste this link into your browser:",
    fallbackUrl: leadsUrl,
    footnote: "You're receiving this because you're a Brick & Wealth administrator.",
  });

  return send({ to, subject, html, text });
}

// ─── INTEREST RECEIVED CONFIRMATION (to the prospect) ─────────────────────────
export async function sendLeadConfirmationEmail({ to, name }) {
  const subject = "We've received your interest — Brick & Wealth";
  const oppsUrl = `${APP_URL}/opportunities`;

  const text = [
    `Hi ${name},`,
    ``,
    `Thank you for registering your interest in Brick & Wealth.`,
    ``,
    `Our investor team will review your details and be in touch shortly with next steps. In the meantime, you're welcome to browse our live opportunities:`,
    ``,
    oppsUrl,
    ``,
    `— The Brick & Wealth Team`,
  ].join("\n");

  const html = renderEmailTemplate({
    preheader: "Thanks for registering your interest — our team will be in touch shortly.",
    heading: "Thank You for Your Interest",
    greeting: `Hi ${escapeHtml(name)},`,
    body:
      "Thank you for registering your interest in Brick & Wealth. Our investor team will review your details and be in touch shortly with next steps. In the meantime, you're welcome to browse our live opportunities.",
    ctaLabel: "Browse Opportunities",
    ctaUrl: oppsUrl,
    expiryNotice: "Membership is by invitation only — we review every request personally.",
    fallbackText: "If the button doesn't work, copy and paste this link into your browser:",
    fallbackUrl: oppsUrl,
    footnote: "If you didn't request this, you can safely ignore this email.",
  });

  return send({ to, subject, html, text });
}

// ─── HTML ESCAPE ──────────────────────────────────────────────────────────────
function escapeHtml(s) {
  if (typeof s !== "string") return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── EMAIL TEMPLATE ───────────────────────────────────────────────────────────
function renderEmailTemplate({
  preheader, heading, greeting, body, ctaLabel, ctaUrl,
  expiryNotice, fallbackText, fallbackUrl, footnote,
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:#f8f4ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0b1220;">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f4ec;">
  <tr>
    <td align="center" style="padding:40px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid rgba(10,31,68,0.08);">

        <!-- Brand bar -->
        <tr>
          <td style="background:#0a1f44;padding:28px 32px;border-bottom:2px solid #c9a24a;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:18px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;color:#ffffff;">
                  Brick<span style="font-style:italic;color:#d9b560;font-weight:500;margin:0 2px;font-family:Georgia,serif;font-size:20px;">&amp;</span>Wealth
                </td>
                <td align="right" style="font-size:10px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;color:#d9b560;">
                  Investor Portal
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Heading -->
        <tr>
          <td style="padding:40px 32px 8px 32px;">
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:32px;line-height:1.1;color:#0b1220;letter-spacing:-0.01em;">
              ${escapeHtml(heading)}
            </h1>
          </td>
        </tr>

        <!-- Greeting + body -->
        <tr>
          <td style="padding:16px 32px 8px 32px;">
            <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#0b1220;">
              ${escapeHtml(greeting)}
            </p>
            <p style="margin:0;font-size:14.5px;line-height:1.7;color:#4a5468;">
              ${escapeHtml(body)}
            </p>
          </td>
        </tr>

        <!-- CTA Button -->
        <tr>
          <td style="padding:32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background:#c9a24a;border-radius:2px;">
                  <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:16px 36px;font-size:12px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#0a1f44;text-decoration:none;">
                    ${escapeHtml(ctaLabel)} →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Expiry notice -->
        <tr>
          <td style="padding:0 32px 24px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(201,162,74,0.08);border:1px solid rgba(201,162,74,0.28);border-left:3px solid #c9a24a;">
              <tr>
                <td style="padding:14px 18px;font-size:13px;line-height:1.5;color:#9a7a2e;">
                  ⏱ &nbsp; ${expiryNotice}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Fallback link -->
        <tr>
          <td style="padding:0 32px 8px 32px;">
            <p style="margin:0 0 8px 0;font-size:12px;line-height:1.5;color:#8a93a6;">
              ${escapeHtml(fallbackText)}
            </p>
            <p style="margin:0;font-size:11.5px;line-height:1.5;word-break:break-all;">
              <a href="${escapeHtml(fallbackUrl)}" style="color:#9a7a2e;text-decoration:underline;">
                ${escapeHtml(fallbackUrl)}
              </a>
            </p>
          </td>
        </tr>

        <!-- Footnote -->
        <tr>
          <td style="padding:32px;border-top:1px solid rgba(10,31,68,0.08);">
            <p style="margin:0;font-size:12px;line-height:1.6;color:#8a93a6;">
              ${escapeHtml(footnote)}
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#06142f;padding:24px 32px;text-align:center;">
            <p style="margin:0 0 8px 0;font-size:10.5px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;color:#d9b560;">
              FCA-Aligned · AML &amp; KYC · GDPR Compliant
            </p>
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.5);">
              © 2026 Brick &amp; Wealth Holdings Ltd · Companies House 14582930
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}