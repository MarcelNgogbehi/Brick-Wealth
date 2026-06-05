// app/api/auth/logout/route.js
//
// POST /api/auth/logout
// Fully signs the visitor out: revokes whatever session token(s) the browser
// is carrying and clears BOTH auth cookies. Clearing both (rather than just
// session_token) means a single "Sign out" reliably de-authenticates the
// browser no matter which role it was holding — you can't be left half-logged-in
// with a stale cookie that still passes the route guard.

import { cookies } from "next/headers";
import { hashToken, verifyCsrf, successResponse } from "@/lib/auth";
import { revokeSession } from "@/lib/db";

export async function POST(request) {
  verifyCsrf(request);

  const cookieStore = await cookies();
  const investorToken = cookieStore.get("session_token")?.value;
  const adminToken = cookieStore.get("admin_session")?.value;

  // Best-effort revoke in the DB — clearing the cookie below is what actually
  // logs the browser out, so a failed/expired revoke must never block that.
  for (const token of [investorToken, adminToken]) {
    if (!token) continue;
    try {
      await revokeSession(hashToken(token));
    } catch {
      // Already expired/gone — cookie still gets cleared.
    }
  }

  const response = successResponse({ message: "Logged out", redirectUrl: "/portal" });

  // Expire both cookies. admin_session is cleared at "/" and "/admin" to cover
  // sessions minted before/after the cookie path was last changed.
  response.headers.append(
    "Set-Cookie",
    "session_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
  );
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
