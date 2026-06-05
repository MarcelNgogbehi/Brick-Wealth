// app/api/auth/reset-password/route.js
//
// POST /api/auth/reset-password
// Body: { token, password }
//
// Production hardening:
//   - Zod validation
//   - After reset: invalidates all sessions, creates a fresh one, sets cookie
//     (user lands on dashboard instead of being kicked to /portal)
//   - Audit log

import {
  hashToken,
  hashPassword,
  generateToken,
  generateRequestId,
  getClientIp,
  getUserAgent,
  verifyCsrf,
  sessionCookieOptions,
  buildCookieHeader,
  errorResponse,
  successResponse,
  SESSION_TTL_MS,
} from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  findValidToken,
  findUserById,
  updateUserPassword,
  consumeToken,
  invalidateUserTokens,
  createSession,
} from "@/lib/db";
import { ResetPasswordSchema, zodFieldErrors } from "@/lib/schemas";
import { log } from "@/lib/logger";

export async function POST(request) {
  const requestId = generateRequestId();
  const startedAt = Date.now();
  const route = "auth.reset_password";

  try {
    if (!verifyCsrf(request)) {
      return errorResponse("Invalid request", 403);
    }

    const ip = getClientIp(request);
    const rl = await rateLimit({
      key: `reset:${ip}`,
      limit: 10,
      windowMs: 60 * 60_000,
    });
    if (!rl.ok) {
      return errorResponse("Too many attempts. Please try again later.", 429);
    }

    let raw;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid request body", 400);
    }

    const parsed = ResetPasswordSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse("Please correct the errors below", 400, zodFieldErrors(parsed.error));
    }
    const { token, password } = parsed.data;

    const tokenHash = hashToken(token);
    const tokenRow = await findValidToken(tokenHash, "reset");

    if (!tokenRow) {
      log.info("auth.reset.invalid_token", { requestId });
      return errorResponse("This reset link is invalid or has expired. Please request a new one.", 400);
    }

    const user = await findUserById(tokenRow.userId);
    if (!user) {
      return errorResponse("Account not found", 400);
    }

    // Update password
    const passwordHash = await hashPassword(password);
    await updateUserPassword(user.id, passwordHash);
    await consumeToken(tokenRow.id);
    await invalidateUserTokens(user.id, "reset");

    // CRITICAL: kill all existing sessions on all devices
    await invalidateUserTokens(user.id, "session");

    log.audit("user.password_reset", { requestId, userId: user.id, ip });

    // Auto-login with a brand-new session
    const sessionToken = generateToken();
    const sessionTokenHash = hashToken(sessionToken);
    const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await createSession({
      userId: user.id,
      tokenHash: sessionTokenHash,
      expiresAt: sessionExpiresAt,
      ip,
      userAgent: getUserAgent(request),
    });

    const response = successResponse({
      message: "Password reset successfully.",
      redirectUrl: "/dashboard",
    });

    response.headers.append(
      "Set-Cookie",
      buildCookieHeader("session_token", sessionToken, sessionCookieOptions())
    );

    log.apiEnd(route, 200, Date.now() - startedAt, { requestId, userId: user.id });
    return response;
  } catch (err) {
    log.apiError(route, err, { requestId });
    return errorResponse("Password reset failed. Please try again.", 500);
  }
}