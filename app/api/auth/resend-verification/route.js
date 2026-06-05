// app/api/auth/resend-verification/route.js
//
// POST /api/auth/resend-verification
// Body: { email }
//
// "Resend the link" button. Always returns generic success.

import {
  generateToken,
  hashToken,
  generateRequestId,
  getClientIp,
  verifyCsrf,
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
import { sendRegistrationEmail } from "@/lib/email";
import { ResendVerificationSchema } from "@/lib/schemas";
import { log } from "@/lib/logger";

const GENERIC_RESPONSE = {
  message: "If an unverified account exists, we've sent a fresh registration link.",
};

export async function POST(request) {
  const requestId = generateRequestId();

  try {
    if (!verifyCsrf(request)) {
      return errorResponse("Invalid request", 403);
    }

    const ip = getClientIp(request);
    const ipLimit = await rateLimit({
      key: `resend:ip:${ip}`,
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

    const parsed = ResendVerificationSchema.safeParse(raw);
    if (!parsed.success) {
      return successResponse(GENERIC_RESPONSE);
    }
    const { email } = parsed.data;

    // Strict per-email rate limit
    const emailLimit = await rateLimit({
      key: `resend:email:${email}`,
      limit: 1,
      windowMs: 60_000,
    });
    if (!emailLimit.ok) {
      return successResponse(GENERIC_RESPONSE);
    }

    const user = await findUserByEmail(email);

    if (user && !user.emailVerified) {
      await invalidateUserTokens(user.id, "register");

      const rawToken = generateToken();
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

      await createAuthToken({
        userId: user.id,
        tokenHash,
        type: "register",
        expiresAt,
      });

      log.audit("user.verification_resent", { requestId, userId: user.id });

      sendRegistrationEmail({
        to: email,
        fullName: user.fullName,
        token: rawToken,
      }).catch((err) => {
        log.error("auth.resend.email_failed", { requestId, error: err?.message });
      });
    }

    return successResponse(GENERIC_RESPONSE);
  } catch (err) {
    log.apiError("auth.resend_verification", err, { requestId });
    return successResponse(GENERIC_RESPONSE);
  }
}