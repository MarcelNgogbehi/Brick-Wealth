// app/api/dashboard/password/route.js
//
// POST /api/dashboard/password
// Body: { currentPassword, newPassword }
//
// SECURITY:
// - Verifies current password (constant-time bcrypt)
// - Validates new password strength
// - Hashes new password with same scheme
// - Revokes all OTHER sessions (keeps the requesting session)
//
// PHASE 4 MSG 2 — HOOK C:
//   After a successful password change, fire a security_alert notification.
//   Security alerts cannot be disabled, so the user will always be told
//   "your password was changed". Both in-app and email.

import { z } from "zod";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  verifyPassword,
  hashPassword,
  hashToken,
  verifyCsrf,
  getClientIp,
  getUserAgent,
} from "@/lib/auth";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import {
  findUserById,
  updateUserPassword,
  revokeAllOtherSessions,
  recordLoginAttempt,
} from "@/lib/db";
import { notifyUser, NOTIFY } from "@/lib/notify";

const Schema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: z.string()
    .min(10, "Password must be at least 10 characters")
    .max(200, "Password too long")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
}).strict()
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must differ from current password",
    path: ["newPassword"],
  });

export async function POST(request) {
  return dashboardRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 403 }
      );
    }

    const user = await requireDashboardUser();

    let raw;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid body" },
        { status: 400 }
      );
    }

    const parsed = Schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || "Invalid input",
          fieldErrors: Object.fromEntries(
            parsed.error.issues.map((i) => [i.path.join("."), i.message])
          ),
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    // Re-fetch with passwordHash (requireDashboardUser doesn't include it)
    const fullUser = await findUserById(user.id);
    if (!fullUser || !fullUser.passwordHash) {
      return NextResponse.json(
        { success: false, message: "Account error — please contact support" },
        { status: 400 }
      );
    }

    // Verify current password
    const valid = await verifyPassword(currentPassword, fullUser.passwordHash);
    if (!valid) {
      // Log as failed login attempt for audit
      const ip = getClientIp(request);
      const userAgent = getUserAgent(request);
      await recordLoginAttempt({
        email: fullUser.email,
        ip,
        userAgent,
        success: false,
      });
      return NextResponse.json(
        { success: false, message: "Current password is incorrect" },
        { status: 401 }
      );
    }

    try {
      // Update password
      const newHash = await hashPassword(newPassword);
      await updateUserPassword(user.id, newHash);

      // Revoke all OTHER sessions (force re-login on other devices)
      // Keep the current session active
      const cookieStore = cookies();
      const currentToken = cookieStore.get("session_token")?.value;
      if (currentToken) {
        await revokeAllOtherSessions(user.id, hashToken(currentToken));
      }

      // PHASE 4 MSG 2 — HOOK C
      // Fire-and-forget security alert. Always sends email + in-app
      // because security_alert is a non-disable-able category.
      const ip = getClientIp(request);
      notifyUser({
        userId: user.id,
        category: NOTIFY.SECURITY_ALERT,
        title: "Your password was changed",
        body: `Your Brick & Wealth password was changed on ${new Date().toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}. If this wasn't you, please contact support@brickandwealth.com immediately and reset your password.`,
        link: "/dashboard/profile",
        metadata: { event: "password_changed", ip },
      }).catch((err) => console.error("[password.change.notify] error:", err?.message));

      return NextResponse.json({
        success: true,
        message: "Password changed. Other devices have been signed out.",
      });
    } catch (err) {
      console.error("[password.change] error:", err?.message);
      return NextResponse.json(
        { success: false, message: "Failed to change password" },
        { status: 500 }
      );
    }
  });
}