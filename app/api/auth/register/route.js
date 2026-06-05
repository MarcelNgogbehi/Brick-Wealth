// app/api/auth/register/route.js
//
// POST /api/auth/register
// Body: { fullName, username, email, residency, country, captchaToken? }
//
// New flow: registration is held for admin approval.
// The user receives NO email on signup — admin must approve before
// the verification link is sent.

import {
  generateRequestId,
  getClientIp,
  verifyCsrf,
  verifyTurnstile,
  errorResponse,
  successResponse,
} from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  findUserByEmail,
  findUserByUsername,
  createPendingUser,
  createPendingUserWithReferral,
  deleteUser,
} from "@/lib/db";
import { RegisterSchema, zodFieldErrors } from "@/lib/schemas";
import { log } from "@/lib/logger";


export async function POST(request) {
  const requestId = generateRequestId();
  const startedAt = Date.now();
  const route = "auth.register";

  try {
    // ─── CSRF ──────────────────────────────────────────────────────
    if (!verifyCsrf(request)) {
      log.warn("auth.register.csrf_failed", { requestId });
      return errorResponse("Invalid request", 403);
    }

    // ─── Rate limit per IP ─────────────────────────────────────────
    const ip = getClientIp(request);
    const ipLimit = await rateLimit({
      key: `register:ip:${ip}`,
      limit: 20,
      windowMs: 60 * 60_000,
    });
    if (!ipLimit.ok) {
      log.warn("auth.register.rate_limited", { requestId, ip });
      return errorResponse("Too many registration attempts. Please try again later.", 429, null, {
        "Retry-After": String(ipLimit.retryAfter || 60),
      });
    }

    // ─── Parse + validate body ────────────────────────────────────
    let raw;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid request body", 400);
    }

    const parsed = RegisterSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse("Please correct the errors below", 400, zodFieldErrors(parsed.error));
    }
    const { fullName, username, email, residency, country } = parsed.data;

    // Phase 7: optional referral code (soft — invalid codes are ignored)
    const referralCodeRaw = typeof raw.referralCode === "string" ? raw.referralCode : null;

    // ─── Optional CAPTCHA ─────────────────────────────────────────
    if (raw.captchaToken !== undefined) {
      const captcha = await verifyTurnstile(raw.captchaToken, ip);
      if (!captcha.ok) {
        log.warn("auth.register.captcha_failed", { requestId, ip });
        return errorResponse("Please complete the security check.", 400);
      }
    }

    // ─── Per-email rate limit (anti-abuse) ────────────────────────
    const emailLimit = await rateLimit({
      key: `register:email:${email}`,
      limit: 10,
      windowMs: 60 * 60_000,
    });
    if (!emailLimit.ok) {
      log.warn("auth.register.email_rate_limited", { requestId, email });
      return errorResponse("Too many requests for this email. Please try again later.", 429);
    }

    // ─── Check uniqueness ─────────────────────────────────────────
    const [existingByEmail, existingByUsername] = await Promise.all([
      findUserByEmail(email),
      findUserByUsername(username),
    ]);

    // ─── Handle existing pending / declined registrations ────────
    if (existingByEmail) {
      if (existingByEmail.registrationStatus === "pending") {
        return successResponse({
          message: "Your registration is already under review. We'll email you once an admin approves it.",
        });
      }
      if (existingByEmail.registrationStatus === "declined") {
        return errorResponse(
          "Your previous registration was not approved. Please contact support.",
          409
        );
      }
      // approved or verified — standard conflict
      return errorResponse("An account with this email already exists", 409, {
        email: "An account with this email already exists",
      });
    }

    if (existingByUsername) {
      return errorResponse("Account already exists", 409, {
        username: "This username is already taken",
      });
    }

    // ─── Create pending user (+ optional referral attribution) ────
    // Phase 7: NO email at signup. The continue-link is sent on admin
    // approval. We just record the pending user and (if a valid code was
    // supplied) chain them to their referrer.
    const { user, referredBy } = await createPendingUserWithReferral({
      email,
      fullName,
      username,
      residency,
      country,
      referralCodeRaw,
    });

    log.audit("user.created", {
      requestId, userId: user.id, email, residency, country,
      referredBy: referredBy || null,
    });

    log.apiEnd(route, 200, Date.now() - startedAt, { requestId, userId: user.id });

    return successResponse({
      message: referredBy
        ? `Thank you. ${referredBy} has introduced you — our team will review your request and email you a link to continue.`
        : "Thank you. Our team will review your request and email you a link to continue once approved.",
    });
  } catch (err) {
    log.apiError(route, err, { requestId });
    return errorResponse("Registration failed. Please try again.", 500);
  }
}
