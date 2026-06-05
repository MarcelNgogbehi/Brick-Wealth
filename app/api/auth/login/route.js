// app/api/auth/login/route.js
//
// POST /api/auth/login
// Body: { identifier, password }
//
// Unified login for investors and admins.
// - identifier is auto-detected: contains "@" → email; else username
// - On success, role determines cookie:
//     investor    → session_token (30-day, path=/)
//     admin       → admin_session (4-hour, path=/admin)
//     super_admin → admin_session (4-hour, path=/admin)
// - Response includes smart redirectUrl based on role + onboarding state

import { z } from "zod";
import {
  verifyPassword,
  generateToken,
  hashToken,
  generateRequestId,
  getClientIp,
  getUserAgent,
  verifyCsrf,
  sessionCookieOptions,
  buildCookieHeader,
  errorResponse,
  successResponse,
  SESSION_TTL_MS,
  MAX_LOGIN_ATTEMPTS,
  LOGIN_LOCKOUT_MS,
} from "@/lib/auth";
import {
  ADMIN_SESSION_TTL_MS,
  adminSessionCookieOptions,
} from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  findUserByEmail,
  findUserByUsername,
  recordLoginAttempt,
  countRecentFailedLogins,
  createSession,
  bumpLastSeen,
} from "@/lib/db";
import { log } from "@/lib/logger";
import { logAdminAction, AUDIT_ACTIONS } from "@/lib/audit";

const LoginSchema = z.object({
  identifier: z.string()
    .min(3, "Please enter your email or username")
    .max(254, "Too long"),
  password: z.string().min(1, "Password is required"),
}).strict();

/**
 * Determine where to send the user after successful login.
 * - admins/super_admins → /admin
 * - investors with incomplete onboarding → /portal/verify (continue wizard)
 * - everyone else (activated or KYC-pending) → /dashboard
 *
 * Note: investors with kycStatus="pending_review" still go to /dashboard —
 * the dashboard home page shows the appropriate banner. Same for users
 * who finished consents but are waiting on KYC approval.
 */
function computeRedirectUrl(user) {
  if (user.role === "admin" || user.role === "super_admin") {
    return "/admin";
  }
  // Investors who haven't finished the wizard go back to /portal/verify
  // Note: emailVerified is already checked above (gate prevents login otherwise)
  if (!user.onboardingComplete || !user.consentsComplete) {
    return "/portal/verify";
  }
  // Otherwise → dashboard. Banner there handles KYC-pending state.
  return "/dashboard";
}

export async function POST(request) {
  const requestId = generateRequestId();

  try {
    if (!verifyCsrf(request)) {
      log.warn("auth.login.csrf_failed", { requestId });
      return errorResponse("Invalid request", 403);
    }

    const ip = getClientIp(request);
    const userAgent = getUserAgent(request);

    // IP rate limit
    const ipLimit = await rateLimit({
      key: `login:ip:${ip}`,
      limit: 20,
      windowMs: 60 * 60_000,
    });
    if (!ipLimit.ok) {
      return errorResponse("Too many login attempts. Try again later.", 429);
    }

    let raw;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid request body", 400);
    }

    const parsed = LoginSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse("Invalid credentials", 401);
    }
    const { identifier, password } = parsed.data;

    // Auto-detect email vs username
    const isEmail = identifier.includes("@");
    const user = isEmail
      ? await findUserByEmail(identifier)
      : await findUserByUsername(identifier);

    // Stable lockout key — prevents attacker switching identifier to reset counter
    const lockoutKey = user?.email || identifier.toLowerCase();
    const recentFails = await countRecentFailedLogins(lockoutKey, LOGIN_LOCKOUT_MS);
    if (recentFails >= MAX_LOGIN_ATTEMPTS) {
      return errorResponse(
        "Account locked due to too many failed attempts. Try again in 15 minutes.",
        429
      );
    }

    // Constant-time bcrypt even when user not found
    const dummyHash = "$2b$12$0000000000000000000000000000000000000000000000000000";
    const passwordValid = user?.passwordHash
      ? await verifyPassword(password, user.passwordHash)
      : await verifyPassword(password, dummyHash);

    if (!user || !passwordValid) {
      await recordLoginAttempt({ email: lockoutKey, ip, userAgent, success: false });
      log.info("auth.login.failed", { requestId, isEmail });
      return errorResponse("Invalid credentials", 401);
    }

    // Registration status checks only apply to investors — admins are never gated
    if (user.role === "investor") {
      if (user.registrationStatus === "pending") {
        await recordLoginAttempt({ email: user.email, ip, userAgent, success: false });
        return errorResponse(
          "Your registration is pending admin approval. We'll email you once it's approved.",
          401
        );
      }

      if (user.registrationStatus === "declined") {
        await recordLoginAttempt({ email: user.email, ip, userAgent, success: false });
        return errorResponse(
          "Your registration was not approved. Please contact support.",
          403
        );
      }
    }

    if (!user.emailVerified) {
      await recordLoginAttempt({ email: user.email, ip, userAgent, success: false });
      return errorResponse(
        "Please verify your email first. Check your inbox for the verification link.",
        401
      );
    }

    if (user.suspendedAt) {
      await recordLoginAttempt({ email: user.email, ip, userAgent, success: false });
      return errorResponse("Account suspended. Please contact support.", 403);
    }

    // Success! Everything below this point that doesn't need the database is
    // computed up front — no round-trips — so the only thing we wait on is the
    // batch of writes.
    const sessionToken = generateToken();
    const sessionTokenHash = hashToken(sessionToken);

    const isAdmin = user.role === "admin" || user.role === "super_admin";
    const ttlMs = isAdmin ? ADMIN_SESSION_TTL_MS : SESSION_TTL_MS;
    const cookieName = isAdmin ? "admin_session" : "session_token";
    const cookieOpts = isAdmin ? adminSessionCookieOptions() : sessionCookieOptions();

    // Smart redirect: admin / onboarding / dashboard
    const redirectUrl = computeRedirectUrl(user);

    // Fire every write concurrently instead of awaiting them one-by-one. On a
    // distant database each round-trip costs ~2s, so four serial writes added
    // ~8s of pure latency to a successful sign-in. Running them together
    // collapses that to a single round-trip window.
    //
    // We use allSettled so a flaky audit/telemetry write can never turn a valid
    // login into a 500 — only the session insert is load-bearing (its cookie is
    // the proof of auth), so that's the single result we gate the response on.
    const [sessionResult] = await Promise.allSettled([
      createSession({
        userId: user.id,
        tokenHash: sessionTokenHash,
        expiresAt: new Date(Date.now() + ttlMs),
      }),
      recordLoginAttempt({ email: user.email, ip, userAgent, success: true }),
      bumpLastSeen(user.id),
      isAdmin
        ? logAdminAction({
            adminId: user.id,
            action: AUDIT_ACTIONS.ADMIN_LOGIN,
            entityType: "user",
            entityId: user.id,
            metadata: {
              loginMethod: isEmail ? "email" : "username",
            },
            request,
          })
        : Promise.resolve(),
    ]);

    if (sessionResult.status === "rejected") {
      log.error("auth.login.session_create_failed", {
        requestId,
        error: sessionResult.reason?.message,
      });
      return errorResponse("Sign in failed", 500);
    }

    log.info("auth.login.success", {
      requestId,
      userId: user.id,
      role: user.role,
      redirectUrl,
    });

    const response = successResponse({
      message: "Welcome",
      redirectUrl,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
      },
    });

    response.headers.append(
      "Set-Cookie",
      buildCookieHeader(cookieName, sessionToken, cookieOpts)
    );

    return response;
  } catch (err) {
    log.error("auth.login.error", { requestId, error: err?.message });
    return errorResponse("Sign in failed", 500);
  }
}