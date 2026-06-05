// app/api/dashboard/profile/route.js
//
// GET   /api/dashboard/profile — returns investor's profile
// PATCH /api/dashboard/profile — updates editable fields
//
// SECURITY:
// - Requires investor session (session_token cookie)
// - Only allows editing safe fields (address, phone, occupation)
// - Email/name/DOB/investor type are admin-only
// - Address changes flag for KYC re-review

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import { getInvestorProfile, updateInvestorProfile } from "@/lib/db";

// ────────────────────────────────────────────────────────────────────
// GET
// ────────────────────────────────────────────────────────────────────
export async function GET() {
  return dashboardRoute(async () => {
    const user = await requireDashboardUser();
    const profile = await getInvestorProfile(user.id);
    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, profile });
  });
}

// ────────────────────────────────────────────────────────────────────
// PATCH
// ────────────────────────────────────────────────────────────────────
const UpdateSchema = z.object({
  addressLine1: z.string().min(1, "Address line 1 required").max(200).optional(),
  addressLine2: z.string().max(200).nullable().optional(),
  city: z.string().min(1, "City required").max(100).optional(),
  region: z.string().max(100).nullable().optional(),
  postcode: z.string().min(1, "Postcode required").max(20).optional(),
  phoneNumber: z.string().max(30).nullable().optional(),
  occupation: z.string().max(120).nullable().optional(),
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

    // Empty strings → null for nullable fields
    const cleaned = {};
    for (const [k, v] of Object.entries(raw)) {
      cleaned[k] = v === "" ? null : v;
    }

    const parsed = UpdateSchema.safeParse(cleaned);
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

    try {
      const updated = await updateInvestorProfile(user.id, parsed.data);

      return NextResponse.json({
        success: true,
        profile: updated,
        message: updated.flaggedForReview
          ? "Profile updated. Address change requires re-verification — we'll be in touch."
          : "Profile updated successfully",
      });
    } catch (err) {
      console.error("[profile.patch] error:", err?.message);
      return NextResponse.json(
        { success: false, message: "Failed to update profile" },
        { status: 500 }
      );
    }
  });
}