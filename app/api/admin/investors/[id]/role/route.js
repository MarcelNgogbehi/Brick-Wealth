// app/api/admin/investors/[id]/role/route.js
//
// PATCH /api/admin/investors/[id]/role
// Body: { role: "investor" | "admin" | "super_admin" }
//
// SUPER ADMIN ONLY. Prevents demoting the last super_admin.

import { z } from "zod";
import { successResponse, errorResponse, verifyCsrf } from "@/lib/auth";
import { requireSuperAdmin, adminRoute } from "@/lib/admin-auth";
import { updateUserRole, findUserById, listAdmins } from "@/lib/db";
import { logAdminAction, AUDIT_ACTIONS } from "@/lib/audit";

const RoleSchema = z.object({
  role: z.enum(["investor", "admin", "super_admin"]),
}).strict();

export async function PATCH(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) {
      return errorResponse("Invalid request", 403);
    }

    const superAdmin = await requireSuperAdmin();
    const { id: targetUserId } = await params;

    const before = await findUserById(targetUserId);
    if (!before) return errorResponse("User not found", 404);

    let raw;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid body", 400);
    }

    const parsed = RoleSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse("Invalid role", 400);
    }
    const { role: newRole } = parsed.data;

    // No-op check
    if (before.role === newRole) {
      return successResponse({
        message: "Role unchanged",
        role: newRole,
      });
    }

    // Prevent demoting yourself if you're the last super_admin
    if (
      before.id === superAdmin.id &&
      before.role === "super_admin" &&
      newRole !== "super_admin"
    ) {
      const admins = await listAdmins();
      const superAdmins = admins.filter((a) => a.role === "super_admin");
      if (superAdmins.length <= 1) {
        return errorResponse(
          "Cannot demote yourself — you are the last super admin",
          400
        );
      }
    }

    // Prevent removing the last super_admin (even if not yourself)
    if (before.role === "super_admin" && newRole !== "super_admin") {
      const admins = await listAdmins();
      const superAdmins = admins.filter((a) => a.role === "super_admin");
      if (superAdmins.length <= 1) {
        return errorResponse(
          "Cannot demote the last super admin",
          400
        );
      }
    }

    const after = await updateUserRole(targetUserId, newRole);

    await logAdminAction({
      adminId: superAdmin.id,
      action: AUDIT_ACTIONS.INVESTOR_ROLE_CHANGED,
      entityType: "user",
      entityId: targetUserId,
      before: { role: before.role },
      after: { role: after.role },
      metadata: {
        targetEmail: before.email,
        targetName: before.fullName,
      },
      request,
    });

    return successResponse({
      message: `Role changed to ${newRole}`,
      user: after,
    });
  });
}