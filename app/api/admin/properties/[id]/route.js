// app/api/admin/properties/[id]/route.js
//
// GET    /api/admin/properties/[id] — single property with images + spv
// PATCH  /api/admin/properties/[id] — update fields
// DELETE /api/admin/properties/[id] — delete (fails if SPV attached)

import { z } from "zod";
import { successResponse, errorResponse, verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { getPropertyById, updateProperty, deleteProperty } from "@/lib/db";
import { logAdminAction } from "@/lib/audit";
import { log } from "@/lib/logger";

// ────────────────────────────────────────────────────────────────────
// GET
// ────────────────────────────────────────────────────────────────────
export async function GET(request, { params }) {
  return adminRoute(async () => {
    await requireAdmin();
    const { id } = await params;

    const property = await getPropertyById(id);
    if (!property) return errorResponse("Property not found", 404);

    return successResponse({ property });
  });
}

// ────────────────────────────────────────────────────────────────────
// PATCH — update
// ────────────────────────────────────────────────────────────────────
const UpdatePropertySchema = z.object({
  title: z.string().min(2).max(120).optional(),
  addressLine1: z.string().min(2).max(200).optional(),
  addressLine2: z.string().max(200).nullable().optional(),
  city: z.string().min(1).max(80).optional(),
  region: z.string().max(80).nullable().optional(),
  postcode: z.string().min(2).max(20).optional(),
  country: z.string().length(2).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  propertyType: z.enum(["house", "flat", "hmo", "commercial", "mixed_use", "land"]).optional(),
  bedrooms: z.number().int().min(0).max(50).nullable().optional(),
  bathrooms: z.number().int().min(0).max(50).nullable().optional(),
  sqft: z.number().int().min(0).max(1_000_000).nullable().optional(),
  yearBuilt: z.number().int().min(1500).max(2100).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  story: z.string().max(5000).nullable().optional(),
  neighbourhoodHighlights: z.string().max(5000).nullable().optional(),
  status: z.enum(["draft", "active", "sold"]).optional(),
}).strict();

export async function PATCH(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) return errorResponse("Invalid request", 403);

    const admin = await requireAdmin();
    const { id } = await params;

    const before = await getPropertyById(id);
    if (!before) return errorResponse("Property not found", 404);

    let raw;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid body", 400);
    }

    // Empty strings → null where appropriate
    const cleaned = {};
    for (const [k, v] of Object.entries(raw)) {
      cleaned[k] = v === "" ? null : v;
    }

    const parsed = UpdatePropertySchema.safeParse(cleaned);
    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues[0]?.message || "Invalid input",
        400,
        Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message]))
      );
    }

    try {
      const updated = await updateProperty(id, parsed.data);

      await logAdminAction({
        adminId: admin.id,
        action: "property.updated",
        entityType: "property",
        entityId: id,
        before: {
          title: before.title,
          status: before.status,
        },
        after: {
          title: updated.title,
          status: updated.status,
        },
        metadata: { fieldsChanged: Object.keys(parsed.data) },
        request,
      });

      return successResponse({ property: updated });
    } catch (err) {
      log.error("property.update.error", { error: err?.message });
      return errorResponse("Failed to update property", 500);
    }
  });
}

// ────────────────────────────────────────────────────────────────────
// DELETE
// ────────────────────────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) return errorResponse("Invalid request", 403);

    const admin = await requireAdmin();
    const { id } = await params;

    const property = await getPropertyById(id);
    if (!property) return errorResponse("Property not found", 404);

    if (property.spv) {
      return errorResponse(
        `Cannot delete: SPV "${property.spv.spvName}" is linked to this property. Delete the SPV first.`,
        409
      );
    }

    try {
      await deleteProperty(id);

      await logAdminAction({
        adminId: admin.id,
        action: "property.deleted",
        entityType: "property",
        entityId: id,
        before: {
          title: property.title,
          city: property.city,
        },
        request,
      });

      return successResponse({ message: "Property deleted" });
    } catch (err) {
      log.error("property.delete.error", { error: err?.message });
      return errorResponse("Failed to delete property", 500);
    }
  });
}