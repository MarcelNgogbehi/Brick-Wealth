// lib/session.js
//
// Reads the session_token httpOnly cookie and returns the current user.
// Used by all authenticated API routes.

import { cookies } from "next/headers";
import { hashToken } from "@/lib/auth";
import { findSessionByTokenHash } from "@/lib/db";

/**
 * Returns the current user, or null if not authenticated.
 * Use this in API routes that require login.
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  if (!sessionToken) return null;

  try {
    const sessionRow = await findSessionByTokenHash(hashToken(sessionToken));
    if (!sessionRow || !sessionRow.user) return null;
    return sessionRow.user;
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return null;
  }
}

/**
 * Wrapper that returns 401 if not authenticated.
 * Throws so the calling route returns a proper error response.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Response(
      JSON.stringify({ error: true, message: "Authentication required" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  return user;
}