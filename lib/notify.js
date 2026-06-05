// lib/notify.js
//
// PHASE 4 MSG 2 — Notification dispatcher.
// PHASE 5 MSG 1 — Added subscription constants + notifyAdminTeam helper.
// PHASE 5 MSG 4 — Added 8 subscription lifecycle senders (bottom of file).
//
// This is the single entry point used everywhere to fire a notification.
// It respects user preferences (Phase 4 Msg 1) and dispatches both
// in-app and email channels.
//
// Usage:
//   import { notifyUser, notifyMany, notifyAdminTeam, NOTIFY } from "@/lib/notify";
//
//   await notifyUser({
//     userId,
//     category: NOTIFY.OPPORTUNITY_PUBLISHED,
//     title: "New opportunity: Birmingham Townhouse",
//     body: "A new investment opportunity is now available...",
//     link: `/dashboard/opportunities/${oppId}`,
//   });
//
// Failures are logged but NEVER thrown — notifications must not break
// the calling flow (e.g. opportunity publishing should still succeed
// even if email dispatch fails).

import {
  createNotificationRow,
  userWantsNotification,
  findUserById,
  NOTIFICATION_CATEGORIES,
} from "@/lib/db";
import { prisma } from "@/lib/prisma";

// Re-export category keys for convenience
export const NOTIFY = {
  OPPORTUNITY_PUBLISHED: "opportunity_published",
  SUBSCRIPTION_UPDATE:   "subscription_update",
  ADMIN_ANNOUNCEMENT:    "admin_announcement",
  PROPERTY_UPDATE:       "property_update",
  SECURITY_ALERT:        "security_alert",

  // ─── Phase 5: subscription lifecycle ─────────────────────────────
  // All map to "subscription_update" category, so they share the
  // (email-undisablable) subscription preference. Phase 5 Msg 4 wires
  // the actual senders — these keys just need to exist for now.
  SUBSCRIPTION_RECEIVED:        "subscription_update",
  SUBSCRIPTION_UNDER_REVIEW:    "subscription_update",
  SUBSCRIPTION_VERIFIED:        "subscription_update",
  SUBSCRIPTION_FUNDED:          "subscription_update",
  SUBSCRIPTION_ALLOCATED:       "subscription_update",
  SUBSCRIPTION_REJECTED:        "subscription_update",
  SUBSCRIPTION_CANCELLED:       "subscription_update",
  WELCOME_FIRST_INVESTMENT:     "subscription_update",

  // ─── Phase 6: secondary flows (sell) ─────────────────────────────
  SALE_REQUEST_UPDATE:          "subscription_update",
  SHARES_ACQUIRED:              "subscription_update",

  // ─── Phase 8: distributions ──────────────────────────────────────
  DISTRIBUTION_RECORDED:        "subscription_update",
};

// ════════════════════════════════════════════════════════════════════
// CORE: notifyUser
//
// Fire a single notification. Both channels (in-app + email) are
// independently gated by user preferences. Either or both may go through.
//
// Returns: { inApp: boolean, email: boolean }
// ════════════════════════════════════════════════════════════════════

export async function notifyUser({
  userId,
  category,
  title,
  body,
  link,
  metadata,
  emailSubject,    // optional override; defaults to title
  emailHtml,       // optional pre-rendered HTML; auto-generated if absent
}) {
  if (!userId || !category || !title) {
    console.error("[notify] missing required fields", { userId, category });
    return { inApp: false, email: false };
  }

  const result = { inApp: false, email: false };

  // Check user wants in-app
  const wantsInApp = await userWantsNotification(userId, category, "inApp").catch(() => false);
  if (wantsInApp) {
    try {
      await createNotificationRow({ userId, category, title, body, link, metadata });
      result.inApp = true;
    } catch (err) {
      console.error("[notify] in-app failed:", err?.message);
    }
  }

  // Check user wants email
  const wantsEmail = await userWantsNotification(userId, category, "email").catch(() => false);
  if (wantsEmail) {
    try {
      const user = await findUserById(userId);
      if (user?.email) {
        const sent = await sendNotificationEmail({
          to: user.email,
          recipientName: user.fullName || "there",
          subject: emailSubject || title,
          title,
          body,
          link,
          html: emailHtml,
        });
        result.email = sent;
      }
    } catch (err) {
      console.error("[notify] email failed:", err?.message);
    }
  }

  return result;
}

// ════════════════════════════════════════════════════════════════════
// FAN-OUT: notifyMany
//
// Fire the same notification to a list of users. Used for announcements
// and "new opportunity published" broadcasts. Returns count of in-app
// + email successes.
//
// Batches in groups of 50 to avoid Resend rate-limit issues and to
// keep individual failures from cascading.
// ════════════════════════════════════════════════════════════════════

export async function notifyMany({ userIds, category, title, body, link, metadata }) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return { inAppCount: 0, emailCount: 0 };
  }

  let inAppCount = 0;
  let emailCount = 0;

  // Process in batches of 50 for predictable performance
  const BATCH_SIZE = 50;
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((uid) =>
        notifyUser({ userId: uid, category, title, body, link, metadata })
      )
    );
    for (const r of results) {
      if (r.status === "fulfilled") {
        if (r.value.inApp) inAppCount++;
        if (r.value.email) emailCount++;
      }
    }
  }

  return { inAppCount, emailCount };
}

// ════════════════════════════════════════════════════════════════════
// FAN-OUT: notifyAdminTeam — Phase 5 Msg 1
//
// Fire the same notification to all active admins + super_admins.
// Used when a new subscription needs review, etc.
// Re-uses the admin_announcement category for preference gating.
//
// Returns { inAppCount, emailCount }.
// ════════════════════════════════════════════════════════════════════

export async function notifyAdminTeam({ title, body, link, metadata }) {
  try {
    const admins = await prisma.user.findMany({
      where: {
        OR: [{ role: "admin" }, { role: "super_admin" }],
        suspendedAt: null,
      },
      select: { id: true },
    });
    if (admins.length === 0) return { inAppCount: 0, emailCount: 0 };

    return notifyMany({
      userIds: admins.map((a) => a.id),
      category: NOTIFY.ADMIN_ANNOUNCEMENT,
      title,
      body,
      link,
      metadata,
    });
  } catch (err) {
    console.error("[notifyAdminTeam] failed:", err?.message);
    return { inAppCount: 0, emailCount: 0 };
  }
}

// ════════════════════════════════════════════════════════════════════
// EMAIL DISPATCH (via Resend)
//
// Renders a brand-aligned HTML email. Uses dynamic import for Resend
// so the rest of this file is import-side-effect-free.
// ════════════════════════════════════════════════════════════════════

async function sendNotificationEmail({
  to, recipientName, subject, title, body, link, html,
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[notify.email] RESEND_API_KEY not set — skipping email");
    return false;
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || "Bricks & Wealth <noreply@brickandwealth.com>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://brickandwealth.com";
  const ctaUrl = link
    ? (link.startsWith("http") ? link : `${appUrl}${link.startsWith("/") ? link : `/${link}`}`)
    : null;

  const renderedHtml = html || renderEmailHtml({
    recipientName,
    title,
    body,
    ctaUrl,
    ctaLabel: ctaUrl ? "View in dashboard" : null,
  });

  try {
    // Dynamic import to avoid hard dep at module load
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html: renderedHtml,
    });

    if (error) {
      console.error("[notify.email] Resend error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[notify.email] dispatch failed:", err?.message);
    return false;
  }
}

// ════════════════════════════════════════════════════════════════════
// EMAIL TEMPLATE — brand-aligned, plain-look
//
// Single template used for all categories. Old-money minimal: navy
// header band, cream body, gold accent. Works in all major clients
// (Gmail, Apple Mail, Outlook).
// ════════════════════════════════════════════════════════════════════

export function renderEmailHtml({ recipientName, title, body, ctaUrl, ctaLabel }) {
  const safeTitle = escapeHtml(title || "");
  const safeBody = body ? escapeHtml(body).replace(/\n/g, "<br>") : "";
  const safeName = escapeHtml(recipientName || "there");
  const safeCtaUrl = ctaUrl ? escapeAttribute(ctaUrl) : "";
  const safeCtaLabel = ctaLabel ? escapeHtml(ctaLabel) : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#F8F4EC;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#0B1220;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8F4EC;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#FFFFFF;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(10,31,68,0.06);">
          <!-- Header band -->
          <tr>
            <td style="background:#0A1F44;padding:24px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:22px;color:#F8F4EC;letter-spacing:-0.01em;">Bricks &amp; Wealth</div>
                    <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#C9A24A;margin-top:4px;font-weight:600;">Holdings · UK Property</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 24px 32px;">
              <p style="margin:0 0 18px 0;font-size:13px;color:#4A5468;">Dear ${safeName},</p>
              <h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:26px;line-height:1.25;color:#0B1220;font-weight:500;">${safeTitle}</h1>
              ${safeBody ? `<div style="font-size:14px;line-height:1.7;color:#3a4358;">${safeBody}</div>` : ""}
            </td>
          </tr>

          ${safeCtaUrl ? `
          <!-- CTA -->
          <tr>
            <td align="center" style="padding:8px 32px 32px 32px;">
              <a href="${safeCtaUrl}" style="display:inline-block;background:#0A1F44;color:#F8F4EC;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:0.04em;">${safeCtaLabel || "View"}</a>
            </td>
          </tr>` : ""}

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background:#FBF8F1;border-top:1px solid rgba(10,31,68,0.06);">
              <p style="margin:0;font-size:11px;line-height:1.6;color:#8A93A6;">
                You're receiving this because of your notification preferences. <a href="${escapeAttribute(process.env.NEXT_PUBLIC_APP_URL || "https://brickandwealth.com")}/dashboard/profile" style="color:#9A7A2E;text-decoration:underline;">Manage preferences</a>
              </p>
              <p style="margin:12px 0 0 0;font-size:11px;color:#8A93A6;">
                Bricks &amp; Wealth Holdings Ltd · Companies House No. 14582930<br>
                <span style="color:#A8AFC0;">This message is intended for the addressee. Property investments carry risk. Capital is at risk.</span>
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

// ─── Safety helpers ─────────────────────────────────────────────────

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

// ════════════════════════════════════════════════════════════════════
// PHASE 5 MSG 4 — SUBSCRIPTION LIFECYCLE SENDERS
//
// These wrap notifyUser / notifyAdminTeam with brand-aligned copy for
// each lifecycle event. All are fire-and-forget safe (never throw).
//
// Call sites:
//   - createSubscription route   → notifySubscriptionReceived + notifyAdminOfNewSubscription
//   - proof upload route          → notifySubscriptionUnderReview (optional)
//   - verify transition          → notifySubscriptionVerified
//   - fund transition            → notifySubscriptionFunded
//   - reject transition          → notifySubscriptionRejected
//   - allocate (cert ready)      → notifySubscriptionAllocated (+ welcome on first)
// ════════════════════════════════════════════════════════════════════

// ─── Investor: subscription received ────────────────────────────────
export async function notifySubscriptionReceived({ userId, opportunityTitle, subscriptionId, currencySymbol, totalAmount }) {
  return notifyUser({
    userId,
    category: NOTIFY.SUBSCRIPTION_RECEIVED,
    title: "We've received your subscription",
    body: `Thank you for subscribing to ${opportunityTitle}. We've recorded your commitment of ${currencySymbol}${Number(totalAmount).toLocaleString("en-GB")}. Please make your bank transfer and upload your proof of payment so our team can verify it.`,
    link: `/dashboard/subscriptions/${subscriptionId}`,
    emailSubject: `Subscription received — ${opportunityTitle}`,
  }).catch((e) => { console.error("[notifySubscriptionReceived]", e?.message); return null; });
}

// ─── Investor: under review (proof uploaded) ────────────────────────
export async function notifySubscriptionUnderReview({ userId, opportunityTitle, subscriptionId }) {
  return notifyUser({
    userId,
    category: NOTIFY.SUBSCRIPTION_UNDER_REVIEW,
    title: "Your payment is being verified",
    body: `We've received your proof of payment for ${opportunityTitle} and our team is now verifying it. We'll let you know as soon as it's confirmed.`,
    link: `/dashboard/subscriptions/${subscriptionId}`,
    emailSubject: `Verifying your payment — ${opportunityTitle}`,
  }).catch((e) => { console.error("[notifySubscriptionUnderReview]", e?.message); return null; });
}

// ─── Investor: verified ─────────────────────────────────────────────
export async function notifySubscriptionVerified({ userId, opportunityTitle, subscriptionId }) {
  return notifyUser({
    userId,
    category: NOTIFY.SUBSCRIPTION_VERIFIED,
    title: "Your subscription is verified",
    body: `Good news — your subscription to ${opportunityTitle} has been verified. We're now confirming receipt of your payment. Your units will be allocated shortly thereafter.`,
    link: `/dashboard/subscriptions/${subscriptionId}`,
    emailSubject: `Subscription verified — ${opportunityTitle}`,
  }).catch((e) => { console.error("[notifySubscriptionVerified]", e?.message); return null; });
}

// ─── Investor: funded ───────────────────────────────────────────────
export async function notifySubscriptionFunded({ userId, opportunityTitle, subscriptionId }) {
  return notifyUser({
    userId,
    category: NOTIFY.SUBSCRIPTION_FUNDED,
    title: "Payment received",
    body: `We've confirmed receipt of your payment for ${opportunityTitle}. Your units are now being allocated and your share certificate will be issued shortly.`,
    link: `/dashboard/subscriptions/${subscriptionId}`,
    emailSubject: `Payment received — ${opportunityTitle}`,
  }).catch((e) => { console.error("[notifySubscriptionFunded]", e?.message); return null; });
}

// ─── Investor: allocated (certificate ready) ────────────────────────
export async function notifySubscriptionAllocated({
  userId, opportunityTitle, subscriptionId, units, certificateNumber, fullyAllocated,
}) {
  return notifyUser({
    userId,
    category: NOTIFY.SUBSCRIPTION_ALLOCATED,
    title: fullyAllocated
      ? "Your shares have been issued"
      : "Some of your shares have been issued",
    body: `${units} unit${units === 1 ? "" : "s"} in ${opportunityTitle} ${units === 1 ? "has" : "have"} been allocated to you${certificateNumber ? `, certificate ${certificateNumber}` : ""}. Your share certificate is ready to download from your subscription page.${fullyAllocated ? "" : " The remaining units will follow shortly."}`,
    link: `/dashboard/subscriptions/${subscriptionId}`,
    emailSubject: `Share certificate ready — ${opportunityTitle}`,
  }).catch((e) => { console.error("[notifySubscriptionAllocated]", e?.message); return null; });
}

// ─── Investor: rejected ─────────────────────────────────────────────
export async function notifySubscriptionRejected({ userId, opportunityTitle, subscriptionId, reason }) {
  return notifyUser({
    userId,
    category: NOTIFY.SUBSCRIPTION_REJECTED,
    title: "Update on your subscription",
    body: `We're sorry, but your subscription to ${opportunityTitle} could not be processed.${reason ? ` Reason: ${reason}` : ""} If you have any questions, please contact our team.`,
    link: `/dashboard/subscriptions/${subscriptionId}`,
    emailSubject: `Subscription update — ${opportunityTitle}`,
  }).catch((e) => { console.error("[notifySubscriptionRejected]", e?.message); return null; });
}

// ─── Investor: welcome (first ever investment) ──────────────────────
export async function notifyWelcomeFirstInvestment({ userId, opportunityTitle }) {
  return notifyUser({
    userId,
    category: NOTIFY.WELCOME_FIRST_INVESTMENT,
    title: "Welcome to your first investment",
    body: `Congratulations on your first investment with Bricks & Wealth — ${opportunityTitle}. You can track your holdings, download your certificates, and follow property updates from your dashboard. We're glad to have you with us.`,
    link: `/dashboard/holdings`,
    emailSubject: "Welcome to Bricks & Wealth",
  }).catch((e) => { console.error("[notifyWelcomeFirstInvestment]", e?.message); return null; });
}

// ─── Admin: new subscription pending review ─────────────────────────
export async function notifyAdminOfNewSubscription({ investorName, opportunityTitle, subscriptionId, currencySymbol, totalAmount, oversized }) {
  return notifyAdminTeam({
    title: `New subscription${oversized ? " (AML)" : ""}: ${opportunityTitle}`,
    body: `${investorName} subscribed to ${opportunityTitle} for ${currencySymbol}${Number(totalAmount).toLocaleString("en-GB")}.${oversized ? " This is over £10,000 and flagged for AML review." : ""} Review it in the subscriptions queue.`,
    link: `/admin/subscriptions/${subscriptionId}`,
    metadata: { subscriptionId, oversized: !!oversized },
  }).catch((e) => { console.error("[notifyAdminOfNewSubscription]", e?.message); return null; });
}


// ════════════════════════════════════════════════════════════════════
// PHASE 6 MSG 2 — SELL SHARES NOTIFICATION SENDERS
// ════════════════════════════════════════════════════════════════════

const SALE_CATEGORY = "subscription_update";

// ─── Investor (seller): sale request received ───────────────────────
export async function notifySaleRequestReceived({ userId, spvName, requestId, unitsOffered }) {
  return notifyUser({
    userId,
    category: SALE_CATEGORY,
    title: "We've received your sale request",
    body: `Your request to sell ${unitsOffered} unit${unitsOffered === 1 ? "" : "s"} in ${spvName} has been received. Our team will review it and be in touch about next steps. Note that share sales are processed manually and are not guaranteed.`,
    link: `/dashboard/sales/${requestId}`,
    emailSubject: `Sale request received — ${spvName}`,
  }).catch((e) => { console.error("[notifySaleRequestReceived]", e?.message); return null; });
}

// ─── Investor (seller): sale settled ────────────────────────────────
export async function notifySaleRequestSettled({ userId, spvName, requestId, units, currencySymbol, amount }) {
  return notifyUser({
    userId,
    category: SALE_CATEGORY,
    title: "Your share sale has been completed",
    body: `Your sale of ${units} unit${units === 1 ? "" : "s"} in ${spvName} has been recorded${amount ? ` at ${currencySymbol}${Number(amount).toLocaleString("en-GB")}` : ""}. Your holding and share certificates have been updated to reflect the transfer.`,
    link: `/dashboard/sales/${requestId}`,
    emailSubject: `Share sale completed — ${spvName}`,
  }).catch((e) => { console.error("[notifySaleRequestSettled]", e?.message); return null; });
}

// ─── Investor (seller): sale declined ───────────────────────────────
export async function notifySaleRequestDeclined({ userId, spvName, requestId, reason }) {
  return notifyUser({
    userId,
    category: SALE_CATEGORY,
    title: "Update on your sale request",
    body: `We're unable to process your request to sell units in ${spvName} at this time.${reason ? ` Reason: ${reason}` : ""} Please contact our team if you'd like to discuss your options.`,
    link: `/dashboard/sales/${requestId}`,
    emailSubject: `Sale request update — ${spvName}`,
  }).catch((e) => { console.error("[notifySaleRequestDeclined]", e?.message); return null; });
}

// ─── Investor (buyer): shares acquired ──────────────────────────────
export async function notifySharesAcquired({ userId, spvName, units, certificateNumber }) {
  return notifyUser({
    userId,
    category: NOTIFY.SHARES_ACQUIRED,
    title: "Shares have been transferred to you",
    body: `${units} unit${units === 1 ? "" : "s"} in ${spvName} ${units === 1 ? "has" : "have"} been transferred to you${certificateNumber ? `, certificate ${certificateNumber}` : ""}. Your new share certificate is available to download from your holdings.`,
    link: `/dashboard/holdings`,
    emailSubject: `Shares transferred to you — ${spvName}`,
  }).catch((e) => { console.error("[notifySharesAcquired]", e?.message); return null; });
}

// ─── Admin: new sale request pending ────────────────────────────────
export async function notifyAdminOfSaleRequest({ investorName, spvName, requestId, unitsOffered, currencySymbol, indicativeAmount }) {
  return notifyAdminTeam({
    title: `Share sale request: ${spvName}`,
    body: `${investorName} wants to sell ${unitsOffered} unit${unitsOffered === 1 ? "" : "s"} in ${spvName} (indicative ${currencySymbol}${Number(indicativeAmount).toLocaleString("en-GB")}). Review it in the sales queue.`,
    link: `/admin/sales/${requestId}`,
    metadata: { requestId },
  }).catch((e) => { console.error("[notifyAdminOfSaleRequest]", e?.message); return null; });
}


// ════════════════════════════════════════════════════════════════════
// PHASE 8 — DISTRIBUTION NOTIFICATIONS
// ════════════════════════════════════════════════════════════════════

// ─── Investor: a distribution has been recorded against their holding ──
export async function notifyDistributionRecorded({
  userId, spvName, distributionLabel, currencySymbol, grossAmount, paymentDate,
}) {
  const amountStr = grossAmount != null
    ? `${currencySymbol}${Number(grossAmount).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`
    : null;
  const dateStr = paymentDate
    ? new Date(paymentDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return notifyUser({
    userId,
    category: NOTIFY.DISTRIBUTION_RECORDED,
    title: `A distribution has been recorded for ${spvName}`,
    body: `${distributionLabel} — your share is ${amountStr || "recorded"}${dateStr ? `, with a payment date of ${dateStr}` : ""}. You can view the detail and download your annual statement from your dashboard.`,
    link: `/dashboard/statements`,
    emailSubject: `Distribution recorded — ${spvName}`,
  }).catch((e) => { console.error("[notifyDistributionRecorded]", e?.message); return null; });
}

// ─── Admin: confirmation that a distribution was recorded ─────────────
export async function notifyAdminOfDistribution({
  spvName, distributionLabel, holdersAtRecord, currencySymbol, totalAmount, distributionId,
}) {
  return notifyAdminTeam({
    title: `Distribution recorded: ${spvName}`,
    body: `${distributionLabel} of ${currencySymbol}${Number(totalAmount).toLocaleString("en-GB", { minimumFractionDigits: 2 })} was attributed pro-rata to ${holdersAtRecord} holder${holdersAtRecord === 1 ? "" : "s"}.`,
    link: `/admin/distributions/${distributionId}`,
    metadata: { distributionId },
  }).catch((e) => { console.error("[notifyAdminOfDistribution]", e?.message); return null; });
}