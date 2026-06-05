// app/api/auth/session/route.js
//
// GET /api/auth/session
// Lightweight "am I logged in?" check for client UI (e.g. the public navbar).
// Returns { authenticated: false } for guests, or a minimal user summary.
// Never throws — guests are a normal, expected case here.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getCurrentAdmin } from "@/lib/admin-auth";

// Reads the session cookie, so it must never be statically cached.
export const dynamic = "force-dynamic";

export async function GET() {
  // Admins and investors authenticate with separate cookies (admin_session vs
  // session_token). The public navbar checks this one endpoint, so we resolve
  // both — admin first, so an admin is correctly sent to the admin console even
  // if a stale investor cookie is also present.
  const admin = await getCurrentAdmin();
  const user = admin || (await getCurrentUser());

  // Never let the browser/CDN cache this — a stale "authenticated: false" from
  // when the visitor was a guest is exactly what leaves the navbar showing
  // "Login / Register" after they sign in.
  const noStore = { "Cache-Control": "no-store, max-age=0, must-revalidate" };

  if (!user) {
    return NextResponse.json({ authenticated: false }, { headers: noStore });
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: {
        fullName: user.fullName || "",
        firstName: (user.fullName || "").trim().split(/\s+/)[0] || "",
        role: user.role,
      },
    },
    { headers: noStore }
  );
}
