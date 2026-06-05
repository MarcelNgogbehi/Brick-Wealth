// app/api/auth/forgot-password/route.js
//
// POST /api/auth/forgot-password
// Body: { email, captchaToken? }
//
// CRITICAL: Always returns success to prevent email enumeration.

import {
  generateToken,
  hashToken,
  generateRequestId,
  getClientIp,
  verifyCsrf,
  verifyTurnstile,
  errorResponse,
  successResponse,
  TOKEN_TTL_MS,
} from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  findUserByEmail,
  invalidateUserTokens,
  createAuthToken,
} from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { ForgotPasswordSchema } from "@/lib/schemas";
import { log } from "@/lib/logger";

const GENERIC_RESPONSE = {
  message: "If an account exists for that email, we've sent a reset link.",
};

export async function POST(request) {
  const requestId = generateRequestId();
  const route = "auth.forgot_password";

  try {
    if (!verifyCsrf(request)) {
      return errorResponse("Invalid request", 403);
    }

    const ip = getClientIp(request);
    const ipLimit = await rateLimit({
      key: `forgot:ip:${ip}`,
      limit: 10,
      windowMs: 60 * 60_000,
    });
    if (!ipLimit.ok) {
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    let raw;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid request body", 400);
    }

    const parsed = ForgotPasswordSchema.safeParse(raw);
    if (!parsed.success) {
      // Even validation errors return generic success — don't leak whether email is valid
      return successResponse(GENERIC_RESPONSE);
    }
    const { email } = parsed.data;

    // Optional CAPTCHA
    if (raw.captchaToken !== undefined) {
      const captcha = await verifyTurnstile(raw.captchaToken, ip);
      if (!captcha.ok) {
        return successResponse(GENERIC_RESPONSE);
      }
    }

    // Per-email rate limit
    const emailLimit = await rateLimit({
      key: `forgot:email:${email}`,
      limit: 3,
      windowMs: 60 * 60_000,
    });
    if (!emailLimit.ok) {
      return successResponse(GENERIC_RESPONSE);
    }

    const user = await findUserByEmail(email);

    if (user && user.emailVerified) {
      await invalidateUserTokens(user.id, "reset");

      const rawToken = generateToken();
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

      await createAuthToken({
        userId: user.id,
        tokenHash,
        type: "reset",
        expiresAt,
      });

      log.audit("user.password_reset_requested", { requestId, userId: user.id });

      // Fire-and-forget — don't reveal timing
      sendPasswordResetEmail({
        to: email,
        fullName: user.fullName,
        token: rawToken,
      }).catch((err) => {
        log.error("auth.forgot.email_failed", { requestId, error: err?.message });
      });
    } else {
      log.info("auth.forgot.no_account", { requestId });
    }

    return successResponse(GENERIC_RESPONSE);
  } catch (err) {
    log.apiError(route, err, { requestId });
    // Even on error, return generic success to maintain enumeration resistance
    return successResponse(GENERIC_RESPONSE);
  }
}