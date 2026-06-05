// app/api/admin/investors/[id]/tags/route.js
//
// PATCH /api/admin/investors/[id]/tags
// Body: { tags: ["VIP", "workshop"] }

import { z } from "zod";
import { successResponse, errorResponse, verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { updateInvestorTags, findUserById } from "@/lib/db";
import { logAdminAction, AUDIT_ACTIONS } from "@/lib/audit";

// Allowed tag values — keep curated for consistency
const ALLOWED_TAGS = [
  "VIP", "workshop", "diaspora", "uk_resident",
  "high_priority", "needs_followup", "test_account",
];

const TagsSchema = z.object({
  tags: z.array(
    z.string().refine((t) => ALLOWED_TAGS.includes(t), {
      message: `Tag must be one of: ${ALLOWED_TAGS.join(", ")}`,
    })
  ).max(10, "Too many tags"),
}).strict();

export async function PATCH(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) {
      return errorResponse("Invalid request", 403);
    }

    const admin = await requireAdmin();
    const { id: userId } = await params;

    const before = await findUserById(userId);
    if (!before) return errorResponse("Investor not found", 404);

    let raw;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid body", 400);
    }

    const parsed = TagsSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues[0]?.message || "Invalid tags",
        400
      );
    }

    // De-duplicate
    const tags = Array.from(new Set(parsed.data.tags));

    const updated = await updateInvestorTags(userId, tags);

    await logAdminAction({
      adminId: admin.id,
      action: AUDIT_ACTIONS.INVESTOR_TAGS_UPDATED,
      entityType: "user",
      entityId: userId,
      before: { tags: before.tags },
      after: { tags: updated.tags },
      request,
    });

    return successResponse({
      message: "Tags updated",
      tags: updated.tags,
      availableTags: ALLOWED_TAGS,
    });
  });
}

export async function GET() {
  // Return the allowed tag values so the UI can show them in a dropdown
  return successResponse({ availableTags: ALLOWED_TAGS });
}