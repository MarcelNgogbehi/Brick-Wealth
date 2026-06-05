// app/api/admin/auth/logout/route.js
//
// POST /api/admin/auth/logout
// Revokes the admin session and clears the admin_session cookie.
// Always clears the cookie even if the session is missing/expired.

import { cookies } from "next/headers";
import {
  hashToken,
  verifyCsrf,
  errorResponse,
  successResponse,
} from "@/lib/auth";
import { revokeSession } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { logAdminAction, AUDIT_ACTIONS } from "@/lib/audit";

export async function POST(request) {
  if (!verifyCsrf(request)) {
    return errorResponse("Invalid request", 403);
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;

  // Best-effort: revoke session in DB and audit-log if session is valid
  if (sessionToken) {
    try {
      await revokeSession(hashToken(sessionToken));
      const admin = await getCurrentAdmin();
      if (admin) {
        await logAdminAction({
          adminId: admin.id,
          action: AUDIT_ACTIONS.ADMIN_LOGOUT,
          entityType: "user",
          entityId: admin.id,
          request,
        });
      }
    } catch {}
  }

  const response = successResponse({
    message: "Signed out",
    redirectUrl: "/portal",
  });

  // Clear at both paths — path="/" for new sessions, path="/admin" for
  // sessions set before the cookie path was updated
  response.headers.append(
    "Set-Cookie",
    "admin_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
  );
  response.headers.append(
    "Set-Cookie",
    "admin_session=; Path=/admin; Max-Age=0; HttpOnly; SameSite=Lax"
  );

  return response;
}
