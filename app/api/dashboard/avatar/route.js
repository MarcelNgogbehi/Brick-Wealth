// app/api/dashboard/avatar/route.js
//
// DELETE /api/dashboard/avatar — removes the investor's profile picture.
//
// UPLOAD MODEL:
//   The actual image upload happens client-side via UploadThing (same as
//   KYC + proof-of-payment). The `avatar` file route persists the URL onto
//   the user record on upload complete. This endpoint only handles removal,
//   so the investor can revert to their initials.
//
// SECURITY: requires investor session + CSRF.

import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import { setUserAvatar } from "@/lib/db";

export async function DELETE(request) {
  return dashboardRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 403 }
      );
    }

    const user = await requireDashboardUser();

    try {
      const updated = await setUserAvatar(user.id, null);
      return NextResponse.json({ success: true, avatarUrl: updated.avatarUrl });
    } catch (err) {
      console.error("[avatar.delete] error:", err?.message);
      return NextResponse.json(
        { success: false, message: "Failed to remove picture" },
        { status: 500 }
      );
    }
  });
}
