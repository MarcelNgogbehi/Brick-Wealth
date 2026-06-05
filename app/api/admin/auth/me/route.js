// app/api/admin/auth/me/route.js
//
// GET /api/admin/auth/me
// Returns current admin's profile. Used by the admin layout
// to verify auth + display admin info.

import { successResponse } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { bumpLastSeen } from "@/lib/db";

export async function GET() {
  return adminRoute(async () => {
    const admin = await requireAdmin();

    // Update lastSeenAt (best-effort)
    bumpLastSeen(admin.id).catch(() => {});

    return successResponse({
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        username: admin.username,
        role: admin.role,
        lastSeenAt: admin.lastSeenAt,
      },
    });
  });
}