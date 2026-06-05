// app/api/auth/verify/route.js
//
// POST /api/auth/verify
// Body: { token, password }
//
// Activates a pending account: validates token, sets password, creates session.

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
  activateUser,
  consumeToken,
  invalidateUserTokens,
  createSession,
} from "@/lib/db";
import { VerifySchema, zodFieldErrors } from "@/lib/schemas";
import { log } from "@/lib/logger";

export async function POST(request) {
  const requestId = generateRequestId();
  const startedAt = Date.now();
  const route = "auth.verify";

  try {
    if (!verifyCsrf(request)) {
      log.warn("auth.verify.csrf_failed", { requestId });
      return errorResponse("Invalid request", 403);
    }

    const ip = getClientIp(request);
    const rl = await rateLimit({
      key: `verify:${ip}`,
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

    const parsed = VerifySchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse("Please correct the errors below", 400, zodFieldErrors(parsed.error));
    }
    const { token, password } = parsed.data;

    const tokenHash = hashToken(token);
    const tokenRow = await findValidToken(tokenHash, "register");

    if (!tokenRow) {
      log.info("auth.verify.invalid_token", { requestId });
      return errorResponse("This link is invalid or has expired. Please request a new one.", 400);
    }

    const user = await findUserById(tokenRow.userId);
    if (!user) {
      return errorResponse("Account not found", 400);
    }

    // Activate user
    const passwordHash = await hashPassword(password);
    await activateUser(user.id, passwordHash);
    await consumeToken(tokenRow.id);
    await invalidateUserTokens(user.id, "register");

    log.audit("user.activated", { requestId, userId: user.id });

    // Auto-login: create session
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
      message: "Account activated. Welcome to Bricks & Wealth.",
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
    return errorResponse("Verification failed. Please try again.", 500);
  }
}