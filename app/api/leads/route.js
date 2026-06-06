// app/api/leads/route.js
//
// POST /api/leads  (public)
// Body: { name, email, location, message?, source? }
//
// Captures a "Register Interest" / "Request Invitation" submission from the
// public marketing site. Stores a Lead row (triaged in /admin/leads), notifies
// the investor team by email, and sends the prospect a confirmation. None of
// the email steps are allowed to fail the request — the lead is what matters.

import {
  generateRequestId,
  getClientIp,
  getUserAgent,
  verifyCsrf,
  errorResponse,
  successResponse,
} from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { createLead, countRecentLeadsByEmail } from "@/lib/db";
import { LeadSchema, zodFieldErrors } from "@/lib/schemas";
import { sendLeadNotificationEmail, sendLeadConfirmationEmail } from "@/lib/email";
import { log } from "@/lib/logger";

export async function POST(request) {
  const requestId = generateRequestId();
  const startedAt = Date.now();
  const route = "leads.create";

  try {
    // ─── CSRF (double-submit cookie minted by proxy) ───────────────
    if (!verifyCsrf(request)) {
      log.warn("leads.create.csrf_failed", { requestId });
      return errorResponse("Invalid request", 403);
    }

    // ─── Rate limit per IP ─────────────────────────────────────────
    const ip = getClientIp(request);
    const ipLimit = await rateLimit({
      key: `leads:ip:${ip}`,
      limit: 12,
      windowMs: 60 * 60_000,
    });
    if (!ipLimit.ok) {
      log.warn("leads.create.rate_limited", { requestId, ip });
      return errorResponse(
        "Too many requests. Please try again later.",
        429,
        null,
        { "Retry-After": String(ipLimit.retryAfter || 60) }
      );
    }

    // ─── Parse + validate ──────────────────────────────────────────
    let raw;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid request body", 400);
    }

    const parsed = LeadSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse("Please correct the errors below", 400, zodFieldErrors(parsed.error));
    }
    const { name, email, location, message, source, investorType, budgetRange, interestType } = parsed.data;

    // ─── Per-email soft de-dupe (silently succeed on repeat) ───────
    const recent = await countRecentLeadsByEmail(email, 24 * 60 * 60_000);
    if (recent >= 3) {
      log.info("leads.create.duplicate_suppressed", { requestId, email });
      return successResponse({
        message: "Thank you — we already have your details and will be in touch shortly.",
      });
    }

    // ─── Persist the lead ──────────────────────────────────────────
    const lead = await createLead({
      name,
      email,
      location,
      message,
      source,
      investorType,
      budgetRange,
      interestType,
      ipAddress: ip,
      userAgent: getUserAgent(request),
      referer: request.headers.get("referer") || null,
    });

    log.audit("lead.created", { requestId, leadId: lead.id, email, location, source });

    // ─── Fire-and-forget notifications (never block the response) ──
    sendLeadNotificationEmail({ name, email, location, message, source, investorType, budgetRange, interestType }).catch((err) =>
      log.error("leads.create.notify_failed", { requestId, error: err?.message })
    );
    sendLeadConfirmationEmail({ to: email, name }).catch((err) =>
      log.error("leads.create.confirm_failed", { requestId, error: err?.message })
    );

    log.apiEnd(route, 200, Date.now() - startedAt, { requestId, leadId: lead.id });

    return successResponse({
      message:
        "Thank you. Our investor team will review your details and be in touch shortly.",
    });
  } catch (err) {
    log.apiError(route, err, { requestId });
    return errorResponse("Something went wrong. Please try again.", 500);
  }
}
