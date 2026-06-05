// app/api/admin/properties/[id]/images/route.js
//
// POST   /api/admin/properties/[id]/images       — register new image metadata
// PATCH  /api/admin/properties/[id]/images       — { imageId, isHero } set hero
// DELETE /api/admin/properties/[id]/images       — { imageId } delete image
//
// IMPORTANT: this route does NOT upload file bytes. Bytes are uploaded
// directly to UploadThing or R2 from the client. The client then POSTs
// the resulting URL + metadata here, and we save it to PropertyImage.

import { z } from "zod";
import { successResponse, errorResponse, verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import {
  getPropertyById,
  addPropertyImage,
  setPropertyHeroImage,
  deletePropertyImage,
} from "@/lib/db";
import { logAdminAction } from "@/lib/audit";
import { log } from "@/lib/logger";

// ────────────────────────────────────────────────────────────────────
// POST — register new image metadata after upload
// ────────────────────────────────────────────────────────────────────
const AddImageSchema = z.object({
  fileUrl: z.string().url("Invalid file URL"),
  fileName: z.string().max(255).optional(),
  fileSize: z.number().int().min(0).optional(),
  mimeType: z.string().max(100).optional(),
  caption: z.string().max(500).optional(),
  altText: z.string().max(500).optional(),
  isHero: z.boolean().optional().default(false),
  storageType: z.enum(["uploadthing", "r2"]).optional().default("uploadthing"),
}).strict();

export async function POST(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) return errorResponse("Invalid request", 403);

    const admin = await requireAdmin();
    const { id: propertyId } = await params;

    const property = await getPropertyById(propertyId);
    if (!property) return errorResponse("Property not found", 404);

    let raw;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid body", 400);
    }

    const parsed = AddImageSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues[0]?.message || "Invalid input",
        400
      );
    }

    try {
      const image = await addPropertyImage({
        propertyId,
        ...parsed.data,
      });

      await logAdminAction({
        adminId: admin.id,
        action: "property.image_added",
        entityType: "property",
        entityId: propertyId,
        metadata: {
          imageId: image.id,
          storageType: image.storageType,
          isHero: image.isHero,
        },
        request,
      });

      return successResponse({ image }, { status: 201 });
    } catch (err) {
      log.error("property.image.add.error", { error: err?.message });
      return errorResponse("Failed to add image", 500);
    }
  });
}

// ────────────────────────────────────────────────────────────────────
// PATCH — set hero image
// ────────────────────────────────────────────────────────────────────
const PatchSchema = z.object({
  imageId: z.string().min(1),
  action: z.enum(["set_hero"]),
}).strict();

export async function PATCH(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) return errorResponse("Invalid request", 403);

    const admin = await requireAdmin();
    const { id: propertyId } = await params;

    let raw;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid body", 400);
    }

    const parsed = PatchSchema.safeParse(raw);
    if (!parsed.success) return errorResponse("Invalid input", 400);

    try {
      const image = await setPropertyHeroImage(parsed.data.imageId);

      await logAdminAction({
        adminId: admin.id,
        action: "property.hero_image_set",
        entityType: "property",
        entityId: propertyId,
        metadata: { imageId: image.id },
        request,
      });

      return successResponse({ image });
    } catch (err) {
      log.error("property.image.hero.error", { error: err?.message });
      return errorResponse(err.message || "Failed to set hero", 500);
    }
  });
}

// ────────────────────────────────────────────────────────────────────
// DELETE — remove an image
// ────────────────────────────────────────────────────────────────────
const DeleteSchema = z.object({
  imageId: z.string().min(1),
}).strict();

export async function DELETE(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) return errorResponse("Invalid request", 403);

    const admin = await requireAdmin();
    const { id: propertyId } = await params;

    let raw;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid body", 400);
    }

    const parsed = DeleteSchema.safeParse(raw);
    if (!parsed.success) return errorResponse("Invalid input", 400);

    try {
      await deletePropertyImage(parsed.data.imageId);

      await logAdminAction({
        adminId: admin.id,
        action: "property.image_deleted",
        entityType: "property",
        entityId: propertyId,
        metadata: { imageId: parsed.data.imageId },
        request,
      });

      return successResponse({ message: "Image deleted" });
    } catch (err) {
      log.error("property.image.delete.error", { error: err?.message });
      return errorResponse("Failed to delete image", 500);
    }
  });
}