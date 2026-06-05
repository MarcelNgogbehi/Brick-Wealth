// app/api/dashboard/preferences/route.js
//
// GET   /api/dashboard/preferences — returns user's notification prefs
// PATCH /api/dashboard/preferences — updates prefs
//        Body: { preferences: [{ category, emailEnabled, inAppEnabled }] }
//
// SECURITY:
// - Auth required
// - PATCH requires CSRF
// - Server-side validates category keys + canDisable rules
// - Mandatory categories (security_alert) can't be disabled even if
//   client sends false

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/db";

// ────────────────────────────────────────────────────────────────────
// GET
// ────────────────────────────────────────────────────────────────────
export async function GET() {
  return dashboardRoute(async () => {
    const user = await requireDashboardUser();
    const preferences = await getNotificationPreferences(user.id);
    return NextResponse.json({ success: true, preferences });
  });
}

// ────────────────────────────────────────────────────────────────────
// PATCH
// ────────────────────────────────────────────────────────────────────
const PreferenceItem = z.object({
  category: z.string().min(1),
  emailEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
}).strict();

const UpdateSchema = z.object({
  preferences: z.array(PreferenceItem).min(1, "At least one preference required"),
}).strict();

export async function PATCH(request) {
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

    const parsed = UpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || "Invalid input",
        },
        { status: 400 }
      );
    }

    try {
      const preferences = await updateNotificationPreferences(
        user.id,
        parsed.data.preferences
      );
      return NextResponse.json({
        success: true,
        preferences,
        message: "Preferences updated",
      });
    } catch (err) {
      console.error("[preferences.patch] error:", err?.message);
      return NextResponse.json(
        { success: false, message: "Failed to update preferences" },
        { status: 500 }
      );
    }
  });
}